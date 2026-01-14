const axios = require("axios");

const SUPERSET_URL = process.env.SUPERSET_URL;
const SUPERSET_ADMIN = process.env.SUPERSET_ADMIN;
const SUPERSET_PASS = process.env.SUPERSET_PASS;

const generateToken = async (req, res) => {
  //   const { dashboard_id } = req.body;
  const companyId = req.query.company_id;
  const authorityId = req.query.authority_id;
    const email = req.query.email;
    
    console.log({companyId},{email});
    

  //   if (!dashboard_id) {
  //     res.status(400).json({ message: "Dashboard Id is required" });
  //   }

  const dashboard_id = "ec33aac0-27f1-4ab9-93e7-b47025b22138";

  companyWiseDataSets = [76];
  emailWiseDataSets = [70, 75, 73];

  const rlsRules = [
    ...companyWiseDataSets.flatMap((id) => ({
      dataset: id,
      clause: `company_id = ${companyId}`,
    })),
    ...emailWiseDataSets.flatMap((id) => ({
      dataset: id,
      clause: `email = '${email}'`,
    })),
  ];

  try {
    console.log("1. Logging into Superset...");

    // Step A: Login as Admin to get an Access Token
    const loginResp = await axios.post(
      `${SUPERSET_URL}/api/v1/security/login`,
      {
        username: SUPERSET_ADMIN,
        password: SUPERSET_PASS,
        provider: "db",
        refresh: true,
      }
    );

    const accessToken = loginResp.data.access_token;
    console.log("   - Success! Got access token.");

    // Step B: Use Access Token to generate a Guest Token (Safe for Frontend)
    console.log("2. Requesting Guest Token...");
    const guestResp = await axios.post(
      `${SUPERSET_URL}/api/v1/security/guest_token/`,
      {
        user: {
          username: "guest_user",
          first_name: "React",
          last_name: "User",
        },
        resources: [
          {
            type: "dashboard",
            id: dashboard_id,
          },
        ],
        rls: rlsRules,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log("   - Success! Sending guest token to React.");
    res.json({ token: guestResp.data.token });
  } catch (error) {
    // Check if it's a response error from Superset
    if (error.response) {
      console.error("Superset Error Detail:");
      // This prints the FULL hidden object
      console.dir(error.response.data, { depth: null, colors: true });
    } else {
      console.error("Error:", error.message);
    }
    res.status(500).send("Error fetching token");
  }
};


const fetchDashboards = async (req, res) => {
  try {
    console.log("1. Logging in as Admin...");
    
    // Step 1: Login to get the Access Token
    const loginResp = await axios.post(`${SUPERSET_URL}/api/v1/security/login`, {
      username: SUPERSET_ADMIN,
      password: SUPERSET_PASS,
      provider: "db",
      refresh: true,
    });
    
    const token = loginResp.data.access_token;
    console.log("   - Logged in successfully.");

    // Step 2: Fetch the Dashboard List
    // We request specific columns: 'dashboard_title' and 'uuid'
    // 'page_size: 100' ensures we get them all (default is 20)
    console.log("2. Fetching Dashboards...");
    
    const dashboardResp = await axios.get(`${SUPERSET_URL}/api/v1/dashboard/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: JSON.stringify({
          page_size: 100, // Fetch up to 100 dashboards
          order_column: "dashboard_title",
          order_direction: "asc",
          // We can't always filter columns easily here, so we fetch all and map later
        })
      }
    });

    // Step 3: Clean the Data for your Database
    const dashboards = dashboardResp.data.result.map(d => ({
      name: d.dashboard_title,
      uuid: d.uuid,  // <--- THIS is what you need for embedding
      id: d.id,      // <--- Keep this internal ID just in case
      url: d.url     // The direct link (e.g., /superset/dashboard/sales/)
    }));

    console.log("\n--- DASHBOARDS FOUND ---");
    console.table(dashboards);
    
    res.status(200).json(dashboards);

    return dashboards;

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
};

module.exports = { generateToken, fetchDashboards };
