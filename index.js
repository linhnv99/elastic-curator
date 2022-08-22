require("dotenv").config();
const { Client } = require("@elastic/elasticsearch");
const { default: axios } = require("axios");
const moment = require("moment");
const cron = require("node-cron");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3333;

const client = new Client({
  node: process.env.HOST || "",
  auth: {
    username: process.env.USER_NAME || "",
    password: process.env.PASSWORD || "",
  },
});

const day = process.env.CURATOR_DAY || 10;
const curatorDate = moment().subtract(day, "d").startOf("day");
const regex = /gift-*/;

const sendNotification = async (data) => {
  return await axios.post(process.env.WEB_HOOK || "", data);
};

const deleteIndices = (indexNames) => {
   client.indices
    .delete({
      index: indexNames,
    })
    .then(
      function (res) {
        const data = {
          text: `*GIFT ELASTIC CURATOR EXECUTED* \n*Indices deleted:* [${indexNames}]`,
        };
        sendNotification(data);
      },
      function (err) {
        const data = {
          text: `*GIFT ELASTIC CURATOR* \n*Error:* ${err.message} `,
        };
        sendNotification(data);
      }
    );
};

const convertToDate = (str) => {
  const [, , dateValue] = str.split("-");
  const date = dateValue.replace(/\./g, "-");
  return moment(date);
};

const run = async (curatorDate) => {
  const indices = await client.cat.indices({
    v: true,
    h: "index,uuid,status,creation.date",
    format: "json",
  });
  let indexNames = [];

  for (let index of indices) {
    const indexName = index.index;
    if (regex.test(indexName)) {
      let idxCreatedAt = convertToDate(indexName);
      if (idxCreatedAt.isBefore(curatorDate) && regex.test(indexName)) {
        indexNames.push(indexName);
      }
    }
  }

  console.log("IndexNames: ", indexNames);

  if (indexNames.length != 0) {
    deleteIndices(indexNames);
  } else {
    await sendNotification({ text: "*GIFT ELASTIC CURATOR EXECUTED*" });
  }
};

cron.schedule(process.env.CRON, () => {
  console.log("Running...");
  run(curatorDate);
  console.log("DONE");
});


app.use("/ping", (req, res) => {
  res.json("Pong");
});

app.listen(PORT, () => console.log(`Server start at http://localhost:${PORT}`));
