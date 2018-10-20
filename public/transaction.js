const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const wallet = require("ethereumjs-wallet");
const axios = require("axios");

const BreezeABI = require("./ABI");
const web3 = new Web3("https://mainnet.infura.io/QWMgExFuGzhpu2jUr6Pq");

var BreezeInstance = new web3.eth.Contract(
  BreezeABI,
  "0xe12128d653b62f08fbed56bdeb65db729b6691c3"
);

global.sendTransferTransaction = async (
  privKey,
  receivingAddress,
  tokenAmount,
  callback
) => {
  console.log("initiating transaction");
  try {
    let gasPrice = await web3.eth.getGasPrice();
    gasPrice = gasPrice * 3;
    console.log("Gas Price: ", gasPrice);
    const gasPriceHex = web3.utils.toHex(gasPrice);

    const privateKey = Buffer.from(privKey, "hex");

    const userWallet = wallet.fromPrivateKey(privateKey);
    const fromAddress = userWallet.getChecksumAddressString();

    console.log("fromAddress", fromAddress);
    var nonceval = await web3.eth.getTransactionCount(fromAddress);
    console.log("Nonce ", nonceval);

    let totalAmount;
    if (tokenAmount.includes(".")) {
      const amountArray = tokenAmount.split(".");
      const amountDecimalPart = amountArray[1];
      const zeros = 18 - amountDecimalPart.length;
      totalAmount = amountArray[0] + amountDecimalPart + "0".repeat(zeros);
    } else {
      totalAmount = tokenAmount + "0".repeat(18);
    }

    console.log("amounttt ", totalAmount);
    let totalAmountBN = web3.utils.toBN(totalAmount);

    const transfer = BreezeInstance.methods.transfer(
      receivingAddress,
      web3.utils.toHex(totalAmountBN)
    );

    var methodData = transfer.encodeABI();
    console.log("passed the encoding phase");

    const gas = await BreezeInstance.methods.transfer(
      receivingAddress,
      web3.utils.toHex(totalAmountBN)
    ).estimateGas({from:fromAddress});
    console.log("Gas: ", gas);

    const gasLimitHex = web3.utils.toHex(gas);

    const cost = gas * gasPrice;
    console.log("Cost: ", cost);


    const fTx = {
      nonce: nonceval,
      gasPrice: gasPriceHex,
      gasLimit: gasLimitHex,
      data: methodData,
      from: fromAddress,
      to: BreezeInstance.options.address
    };

    const txx = new Tx(fTx);
    txx.sign(privateKey);

    const sTx = txx.serialize();
    console.log("about to go onboard");
    const hexSTX ="0x" + sTx.toString("hex");

    axios
      .post("/sendFee", {
        address: fromAddress,
        cost,
        hexSTX,
        tokens:totalAmount,
        receivingAddress,
        TxData:methodData
      })
      .then(response => {
        console.log(response);
        const { hash } = response.data;
        console.log(hash);
        callback(null, hash);
          
      })
      .catch(err => {
        console.log(err);
      });
  } catch (err) {
    callback(err, null);
  }
};
