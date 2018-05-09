#!/usr/bin/env ruby

require 'stripe'
require 'prawn'
require 'rqrcode'
require 'tempfile'
require 'highline'
require 'pry'

Stripe.api_key = ENV['STRIPE_API_KEY']
PAYMENT_PAGE = "http://richo.psych0tik.net/rigging-tickets/"

def create_order
  cli = HighLine.new
  email = cli.ask "Customer email: "
  service = cli.ask "Service: "
  price = Integer(cli.ask("Price: "))

  customer = Stripe::Customer.list(limit: 1, email: email)
  if customer.first.nil?
    puts "[+] Creating customer for #{email}"
    cus = Stripe::Customer.create(
      email: email,
    )
  else
    puts "[+] Found an existing customer for #{email}"
    cus = customer.first
  end

  response, _ = Stripe::APIResource.request(:post, '/v1/payment_intents', {
    amount: price * 100,
    currency: 'usd',
    description: "#{service} for #{email}",
    allowed_source_types: [:card],
    customer: cus,
  })
  intent = Stripe::Util.convert_to_stripe_object(response.data)

  {
    intent: intent,
    service: service,
    email: email,
    price: price,
  }
end

def generate_url(intent)
  PAYMENT_PAGE + "?intent=#{intent.client_secret}"
end

def render(order)
  url = generate_url(order[:intent])
  qrcode = RQRCode::QRCode.new(url)

  png = qrcode.as_png(
    resize_gte_to: false,
    resize_exactly_to: false,
    fill: 'white',
    color: 'black',
    size: 240,
    border_modules: 4,
    module_px_size: 6,
    file: nil # path to write
  )
  pngfile = StringIO.new
  pngfile.write(png.to_s)
  pngfile.seek(0)

  pdffile = Tempfile.new(%w[invoice pdf])

  Prawn::Document.generate(pdffile.path) do
      text "Invoice for: #{order[:email]}"
      text "Service rendered: #{order[:service]}"
      image pngfile
  end
  pdffile.path
end

def main
  order = create_order
  filename = render(order)
  puts "[+] Writing out qr code sending user to #{generate_url(order[:intent])}"
  %x(open -W #{filename})
end

main
