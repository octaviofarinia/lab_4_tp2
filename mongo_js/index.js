const axios = require("axios");
const { MongoClient } = require("mongodb");

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

const insertData = async (collection, countryData) => {
  const { numericCode, name, capital, region, population, latlng } =
    countryData;
  const [lat, lng] = latlng;

  await collection.insertOne({
    codigoPais: numericCode,
    nombrePais: name,
    capitalPais: capital,
    region: region,
    poblacion: population,
    latitud: lat,
    longitud: lng,
  });
};

const migracionInicial = async () => {
  for (let code = 1; code <= 300; code++) {
    console.log(`Fetching data for code ${code}...`);

    const data = await fetchData(code);

    if (data && data.length > 0) {
      for (const countryData of data) {
        try {
          await insertData(collection, countryData);
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
};

async function findDocumentsWithRegionAmericas(collection) {
  try {
    const query = { region: "Americas" };
    const results = await collection.find(query).toArray();
    return results;
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
}

async function findDocumentsWithRegionAmericasAndLargePopulation(collection) {
  const query = { region: "Americas", poblacion: { $gt: 100000000 } };
  const results = await collection.find(query).toArray();
  return results;
}

async function findDocumentsWithRegionNotAfrica(collection) {
  const query = { region: { $ne: "Africa" } };
  const results = await collection.find(query).toArray();
  return results;
}

async function updateEgyptDocument(collection) {
  const filter = { nombrePais: "Egypt" };
  const update = {
    $set: {
      nombrePais: "Egipto",
      poblacion: "Egipto",
    },
  };
  const result = await collection.updateOne(filter, update);
  return result;
}

async function deleteDocumentWithCodigoPais258(collection) {
  const filter = { codigoPais: "258" };
  const result = await collection.deleteOne(filter);
  return result;
}

async function findDocumentsWithPopulationBetween50MAnd150M(collection) {
  const query = { poblacion: { $gt: 50000000, $lt: 150000000 } };
  const results = await collection.find(query).toArray();
  return results;
}

async function findAllDocumentsSortedByNombrePaisAsc(collection) {
  const query = {};
  const options = { sort: { nombrePais: 1 } };
  const results = await collection.find(query, options).toArray();
  return results;
}

async function createIndexOnCodigoPais(collection) {
  const indexSpecification = { codigoPais: 1 };
  const result = await collection.createIndex(indexSpecification);
  return result;
}

async function findDocumentsWithSkip(collection) {
  const query = {};
  const options = { sort: { nombrePais: 1 }, skip: 20, limit: 10 };
  const results = await collection.find(query, options).toArray();
  return results;
}

const main = async () => {
  const uri = "mongodb://root:root@localhost:27017/admin";
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db("tp_2");
    const collection = db.collection("pais");

    // await migracionInicial();
    console.log(
      "5.1. Codifique un método que seleccione los documentos de la colección países donde la región sea Americas. Muestre el resultado por pantalla o consola."
    );
    console.log(await findDocumentsWithRegionAmericas(collection));

    console.log(
      "5.2. Codifique un método que seleccione los documentos de la colección países donde la región sea Americas y la población sea mayor a 100000000. Muestre el resultado por pantalla o consola."
    );
    console.log(
      await findDocumentsWithRegionAmericasAndLargePopulation(collection)
    );

    console.log(
      "5.3. Codifique un método que seleccione los documentos de la colección países donde la región sea distinto de Africa. (investigue $ne). Muestre el resultado por pantalla o consola."
    );
    console.log(await findDocumentsWithRegionNotAfrica(collection));

    console.log(
      "5.4. Codifique un método que actualice el documento de la colección países donde el name sea Egypt, cambiando el name a “Egipto” y la población a 95000000"
    );
    console.log(await updateEgyptDocument(collection));

    console.log(
      "5.5. Codifique un método que elimine el documento de la colección países donde el código del país sea 258"
    );
    console.log(await deleteDocumentWithCodigoPais258(collection));

    console.log(
      "5.6. Describa que sucede al ejecutar el método drop() sobre una colección y sobre una base de datos."
    );
    console.log(
      "El metodo drop() es utilizado para eliminar una coleccion. Por ejemplo await collection.drop(). Una vez que una coleccion es eliminada los datos que esta contenia se pierden."
    );

    console.log(
      "5.7. Codifique un método que seleccione los documentos de la colección países cuya población sea mayor a 50000000 y menor a 150000000. Muestre el resultado por pantalla o consola."
    );
    console.log(await findDocumentsWithPopulationBetween50MAnd150M(collection));

    console.log(
      "5.8. Codifique un método que seleccione los documentos de la colección países ordenados por nombre (name) en forma Ascendente. sort(). Muestre el resultado por pantalla o consola."
    );
    console.log(
      (await findAllDocumentsSortedByNombrePaisAsc(collection)).length
    );

    console.log(
      "5.9. Describa que sucede al ejecutar el método skip() sobre una colección. Ejemplifique con la colección países."
    );
    console.log(
      "El metodo skip() controla el punto inicial a partir del cual comenzara la busqueda, es decir salta los primeros n documentos. Se puede usar en combinacion con limit() para implementar paginacion, ver ejemplo en metodo findDocumentsWithSkip(collection)."
    );

    console.log(
      "5.10. Describa y ejemplifique como el uso de expresiones regulares en Mongo puede reemplazar el uso de la cláusula LIKE de SQL."
    );
    console.log(
      "En Mongo se pueden ejecutar busquedas con expresiones regulares utilizando el operador $regex, por ejemplo: collection.find({nombrePais: {$regex: /.*a.*/}}) esto es equivalente a un select * from pais where nombrePais like '%a%."
    );
    console.log(
      "Tambien se pueden agregar opciones al filtro de expresion regular, por ejemplo collection.find({nombrePais: {$regex: /.*a.*/, $options: 'i'}}) esto significa que la busqueda es case insensitive."
    );

    console.log(
      "5.11. Cree un nuevo índice para la colección países asignando el campo código como índice. investigue createIndex())"
    );
    console.log(await createIndexOnCodigoPais(collection));

    console.log(
      "5.12. Describa como se realiza un backup de la base de datos mongo países_db."
    );
    console.log(
      "Se puede realizar un backup de la base de datos con mongodump. Por ejemplo ejecutando el siguiente comando en la consola: mongodump --db tp_2 --out /path/to/backup/directory"
    );
    console.log(
      "Luego de realizado un backup se puede restaura la base de datos con el sigiuente comando: mongorestore --db tp_2 /path/to/backup/directory/tp_2"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  } finally {
    await client.close();
  }
};

main();
