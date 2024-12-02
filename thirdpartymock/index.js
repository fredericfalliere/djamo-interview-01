const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const getResponseLag = () => Math.random() * (10_000 - 200) + 200;
const getWebhookLag = () => Math.random() * (30_000 - 10_000) + 10_000;
const getTimeoutLag = () => Math.random() * (120_000 - 30_000) + 30_000;
const transactions = {};

const simulateLatency = (latency) => {
  return new Promise((fn) => setTimeout(fn, latency));
};

const sendWebhook = (id) => {
  const { status, webhookUrl } = transactions[id];
  console.log("Sending webhook url for id=", id, " status=", status, " webhookUrl=",  webhookUrl);
  axios
    .post(webhookUrl, { id, status })
    .catch(() => console.log(`Could not post webhook for ${id}`));
};


app.post("/transaction", (req, res) => {
  console.log("=================")
  console.log("POST /transaction", req.body);
  const status = Math.random() > 1 / 3 ? "completed" : "declined";
  const { id, webhookUrl } = req.body;
  const workingConditions = req.body.workingConditions

  // 10% of the time, will timeout. Half of the time, the transaction is actually processed.
  const shouldTimeout = workingConditions ? workingConditions.shouldTimeout : Math.random() < 1 / 10;
  if (shouldTimeout) {
    console.log("Will timeout");
    const shouldWork = workingConditions ? workingConditions.shouldTimeoutAndWork : Math.random() > 1 / 2;
    if (shouldWork) {
      console.log("... but will actually work");
      simulateLatency(getTimeoutLag()).then(() => {
        transactions[id] = { id, status, webhookUrl };
      });
    } else {
      console.log("... will drop the transaction");
    }
    return simulateLatency(30_000).then(() => {
      console.log("Return 504");
      res.status(504).send("Timeout")
    });
  }

  // Persist the transaction in memory
  transactions[id] = { id, status: "pending", webhookUrl };

  console.log("Added your transaction to our local database")

  // Schedule webhook, for 80% of the cases
  const shouldSendWebhook = workingConditions ? workingConditions.shouldSendWebhook : Math.random() > 1 / 5;
  if (shouldSendWebhook) {
    console.log("Will send webhook eventually")
    simulateLatency(getWebhookLag()).then(() => sendWebhook(id));
  }

  // Return the response otherwise
  simulateLatency(getResponseLag()).then(() => {
    console.log("Returning the response")
    transactions[id].status = status;
    res.send(transactions[id]);
  });
});

app.get("/transaction/:id", (req, res) => {
  console.log("=================")
  const transaction = transactions[req.params.id];
  console.log("GET /transaction/", req.params.id, " ", transaction === undefined ? "not found":("it exists with status"+transaction.status));
  if (transaction === undefined) {
    res.status(404).send();
  } else {
    res.send(transaction);
  }
});


app.get("/transactions/", (req, res) => {
  res.send(transactions);
});

app.listen(port, () => {
  console.log(`Third party mock is listening on port ${port}`);
});
