document.getElementById("tranferTokens").addEventListener("click", function() {
  const privKey = $("#privKey").val();
  const toAddress = $("#recevingAddress").val();
  const amount = $("#tokenAmount").val();

  const loader = $(".loader");
  loader.css("display", "block");

  const loaderText = $("#loaderText");
  loaderText.html("Transaction is being mined");

  $("#tranferTokens").prop("disabled", true);

  sendTransferTransaction(
    privKey.trim(),
    toAddress.trim(),
    amount.trim(),
    (err, hash) => {
      $("#tranferTokens").prop("disabled", false);
      if (err) {
        loaderText.html("There is an error in mining the transaction " + err);
        loader.css("display", "none");
        console.log("There's an error in mining the transaction");
        return;
      }
      loader.css("display", "none");
      loaderText.html("Transaction has been sent. Hash: "+hash);

      console.log("transaction has been mined");
    }
  );
});
