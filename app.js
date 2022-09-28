const express = require("express");
const bodyparser = require('body-parser')
const app = express();
const cors = require('cors')
const stripe = require("stripe")("sk_test_51LEegGBKQ6NhLAIhrSfePjgBMFqnaNUaUG25EHOcDvVeMZvLSvgbwcOubrm0EmhkWx1AEDB8faBDUJJDGKzYGanJ00oJmjoLV7"); //private key

const portNumber = 3000;

app.use(cors())
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

// Create product with associated price and payment link on our Stripe account
app.post("/create-product", async(req, res) => {
  // Create product
  const product = await stripe.products.create({
    // id: set to same id as product has in educoin backend
    name: "test product",
    shippable: false,
  });
  // Create associated price
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 1000, // hardcoded value (change to actual price)
    product: product.id,
  })
  // Create payment link 
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{price: price.id, quantity: 1}],
    application_fee_amount: price.unit_amount * 0.079 + 30,
    currency: 'usd',
    transfer_data: 
      {
        destination: "acct_1LeRvIBDURLiivY0"
      }
  })
})

// Disable payment link when content is disabled or deleted
app.post("/disable-paymentlink", async(req, res) => {
  await stripe.paymentLinks.update(
    req.id,
    {active: false}
  );
})

// Reactivate payment link
app.post("/activate-paymentlink", async(req, res) => {
  await stripe.paymentLinks.update(
    req.id,
    {active: true}
  )
})

// Return payment link url
app.post("/order", async(req, res) => {
  const paymentLink = await stripe.paymentLinks.retrieve("plink_1LmOZQBKQ6NhLAIhZy7qeDnz");
  res.json({paymentLink: paymentLink.url});
})

// Create connected account and return onboarding link
app.post("/create-connected-account", async(req, res) => {
  const account = await stripe.accounts.create({
    type: 'express',
    business_type: 'individual'
  });
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://example.com/reauth',
    return_url: 'https://example.com/return',
    type: 'account_onboarding',
  });
  res.json({onboardLink: accountLink.url})
})

app.listen(portNumber,()=>{
    console.log('The server running on ', portNumber);
})
