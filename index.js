const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// 🔐 Token generation (keep secrets here!)
async function getToken() {
  const response = await axios.post(
    `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: "https://orgcd0dfd17.crm8.dynamics.com",
      grant_type: "client_credentials",
    })
  );

  return response.data.access_token;
}

// 📤 POST data to Dataverse
app.post("/postToDataverse", async (req, res) => {
  try {
    const token = await getToken();
    const response = await axios.post(
      "https://yourenvironment.api.crm.dynamics.com/api/data/v9.2/new_schools",
      req.body, // JSON body from Wix
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📥 GET data
app.get("/getSchools", async (req, res) => {
  try {
    const token = await getToken();
    const response = await axios.get(
      "https://yourenvironment.api.crm.dynamics.com/api/data/v9.2/new_schools",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
