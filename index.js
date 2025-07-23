const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const cors=require("cors");
app.use(cors());

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Dataverse API is running!");
});

// 🔐 Get Access Token
async function getToken() {
  const response = await axios.post(
    `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: `${process.env.RESOURCE_URL}/.default`,
      grant_type: "client_credentials",
    })
  );
  return response.data.access_token;
}

// 📥 GET - Read data with optional $select and $filter
app.get("/getData", async (req, res) => {
  try {
    const { table, select, filter } = req.query;
    if (!table) return res.status(400).json({ error: "Missing 'table' query param" });

    const token = await getToken();
    let url = `${process.env.RESOURCE_URL}/api/data/v9.2/${table}`;
    const query = [];

    if (select) query.push(`$select=${select}`);
    if (filter) query.push(`$filter=${filter}`);

    if (query.length) url += "?" + query.join("&");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📤 POST - Create record
app.post("/postToDataverse", async (req, res) => {
  try {
    const { table, data } = req.body;
    if (!table || !data) return res.status(400).json({ error: "Missing table or data." });

    const token = await getToken();
    const response = await axios.post(
      `${process.env.RESOURCE_URL}/api/data/v9.2/${table}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✏️ PATCH - Update record by ID
app.patch("/updateDataverse", async (req, res) => {
  try {
    const { table, id, data } = req.body;
    if (!table || !id || !data) return res.status(400).json({ error: "Missing table, id, or data." });

    const token = await getToken();
    await axios.patch(
      `${process.env.RESOURCE_URL}/api/data/v9.2/${table}(${id})`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "If-Match": "*",
        },
      }
    );
    res.json({ success: true, message: "Record updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🗑️ DELETE - Delete record by ID
app.delete("/deleteFromDataverse", async (req, res) => {
  try {
    const { table, id } = req.body;
    if (!table || !id) return res.status(400).json({ error: "Missing table or id." });

    const token = await getToken();
    await axios.delete(
      `${process.env.RESOURCE_URL}/api/data/v9.2/${table}(${id})`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "If-Match": "*",
        },
      }
    );
    res.json({ success: true, message: "Record deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API is live on port ${PORT}`));
