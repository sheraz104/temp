const express = require("express");
const https = require("https");
const path = require("path");
const bodyParser = require("body-parser");
const wallet = require("ethereumjs-wallet");
const Tx = require("ethereumjs-tx");

const cors = require("cors");
const BreezeABI = require("./public/ABI");

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  next();
});


const private_key = process.env.PRIV_KEY;
const Web3 = require("web3");

const web3 = new Web3("https://mainnet.infura.io/QWMgExFuGzhpu2jUr6Pq");
const BreezeInstance = new web3.eth.Contract(
  BreezeABI,
  "0xe12128d653b62f08fbed56bdeb65db729b6691c3"
);

app.use(express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.get("/", (req, res) => {
  res.send("Hello, World")
});

app.post("/sendFee", async (req, res) => {
  const { address, cost, hexSTX, tokens, receivingAddress, TxData } = req.body;

  let balance = await BreezeInstance.methods.balanceOf(address).call();
  console.log(tokens);
  if (parseInt(tokens) > balance) {
    res.send({ err: "Token balance is not enough" });
  }

  const transfer = BreezeInstance.methods.transfer(
    receivingAddress,
    web3.utils.toHex(web3.utils.toBN(tokens))
  );

  var methodData = transfer.encodeABI();

  console.log(methodData, "TxData", TxData);
  if (methodData != TxData) {
    res.send({ err: "Tx don't match" });
  }

  const privateKey = Buffer.from(private_key, "hex");

  const userWallet = wallet.fromPrivateKey(privateKey);
  const fromAddress = userWallet.getChecksumAddressString();
  const nonceval = await web3.eth.getTransactionCount(fromAddress);

  let gasPrice = await web3.eth.getGasPrice();
  gasPrice = gasPrice * 3;
  const gasPriceHex = web3.utils.toHex(gasPrice);
  const gasLimitHex = web3.utils.toHex(21000);

  const fTx = {
    nonce: nonceval,
    gasPrice: gasPriceHex,
    gasLimit: gasLimitHex,
    from: fromAddress,
    to: address,
    value: web3.utils.toHex(cost)
  };

  const txx = new Tx(fTx);
  txx.sign(privateKey);

  const sTx = txx.serialize();
  web3.eth
    .sendSignedTransaction("0x" + sTx.toString("hex"))
    .on("receipt", receipt => {
      web3.eth
        .sendSignedTransaction(hexSTX)
        .on("receipt", receipt => {
          //   console.log(receipt);
        })
        .on("transactionHash", hash => {
          console.log("hash ", hash);
          res.send({ hash });
        })
        .on("error", error => {
          res.send({ err: error });
        });
    })
    .on("transactionHash", hash => {
      console.log("hash ", hash);
    })
    .on("error", error => {
      res.send({ err: error });
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server is running on port ", PORT);
});
