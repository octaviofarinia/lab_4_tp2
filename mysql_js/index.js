const axios = require("axios");
const mysql = require("mysql2/promise");

const fetchData = async (code) => {
  try {
    const response = await axios.get(
      `https://restcountries.com/v2/callingcode/${code}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for code ${code}:`, error.message);
    return null;
  }
};

const insertData = async (connection, countryData) => {
  const query = `
    INSERT INTO pais_js (codigoPais, nombrePais, capitalPais, region, poblacion, latitud, longitud)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  const { numericCode, name, capital, region, population, latlng } =
    countryData;
  const [lat, lng] = latlng;

  await connection.execute(query, [
    numericCode,
    name,
    capital,
    region,
    population,
    lat,
    lng,
  ]);
};

const main = async () => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "lab_iv_tp_2",
  });

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS pais (
      codigoPais BIGINT,
      nombrePais VARCHAR(50) NOT NULL,
      capitalPais VARCHAR(50) NOT NULL,
      region VARCHAR(50) NOT NULL,
      poblacion BIGINT NOT NULL,
      latitud DOUBLE NOT NULL,
      longitud DOUBLE NOT NULL,
      PRIMARY KEY (codigoPais)
    );
  `);

  for (let code = 1; code <= 300; code++) {
    console.log(`Fetching data for code ${code}...`);

    const data = await fetchData(code);

    if (data && data.length > 0) {
      for (const countryData of data) {
        try {
          await insertData(connection, countryData);
          console.log(`Inserted data for ${countryData.name} (code ${code})`);
        } catch (error) {
          console.error(
            `Error inserting data for ${countryData.name} (code ${code}):`,
            error.message
          );
        }
      }
    }
  }

  await connection.end();
};

main();
