package com.mysql.jdbc;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import com.mysql.cj.util.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.*;
import java.util.HashSet;
import java.util.Set;

public class RowInsert {

    public static final String SQL_INSERT = "INSERT INTO Pais (codigoPais, nombrePais, capitalPais, region, poblacion, latitud, longitud) VALUES (?,?,?,?,?,?,?)";

    public static Set<Integer> integerHashSet = new HashSet<>();

    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection("jdbc:mysql://127.0.0.1:3306/lab_iv_tp_2?useUnicode=true&useJDBCCompliantTimezoneShift=true&useLegacyDatetimeCode=false&serverTimezone=UTC", "root", "root");
             PreparedStatement preparedStatement = conn.prepareStatement(SQL_INSERT)) {
            for (int i = 1; i <= 300; i++) {
                String jsonString = getResponseString(i);
                if (StringUtils.isNullOrEmpty(jsonString) || jsonString.equals("[]")) {
                    continue;
                }

                for (JsonElement jsonElement : getJsonArray(jsonString).getAsJsonArray()) {
                    JsonObject jsonCountry = jsonElement.getAsJsonObject();
                    System.out.println("JSON: ");
                    System.out.println(jsonCountry);

                    if (!isValidCountry(jsonCountry)) {
                        continue;
                    }

                    int row = generateInsert(
                            preparedStatement,
                            jsonCountry.get("numericCode").getAsInt(),
                            jsonCountry.get("name").getAsString(),
                            jsonCountry.get("capital").getAsString(),
                            jsonCountry.get("region").getAsString(),
                            jsonCountry.get("population").getAsLong(),
                            jsonCountry.get("latlng").getAsJsonArray().get(0).getAsDouble(),
                            jsonCountry.get("latlng").getAsJsonArray().get(1).getAsDouble()
                    );
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            System.err.format("SQL State: %s\n%s", e.getSQLState(), e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static boolean isValidCountry(JsonObject jsonCountry) {
        try {
            Integer numericCode = jsonCountry.get("numericCode").getAsInt();
            if(integerHashSet.contains(numericCode)) {
                return false;
            }

            jsonCountry.get("name").getAsString();
            jsonCountry.get("capital").getAsString();
            jsonCountry.get("region").getAsString();
            jsonCountry.get("population").getAsLong();
            jsonCountry.get("latlng").getAsJsonArray().get(0).getAsDouble();
            jsonCountry.get("latlng").getAsJsonArray().get(1).getAsDouble();
        } catch (Exception e) {
            return false;
        }
        return true;
    }

    private static String getResponseString(int i) throws IOException {
        URL url = new URL("https://restcountries.com/v2/callingcode/" + i);
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("GET");

        int responseCode = con.getResponseCode();

        if (responseCode >= 200 && responseCode < 300) {
            BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
            String inputLine;
            StringBuffer content = new StringBuffer();
            while ((inputLine = in.readLine()) != null) {
                content.append(inputLine);
            }
            in.close();
            con.disconnect();

            String jsonString = content.toString();
            return jsonString;
        } else {
            System.out.println("Error: HTTP response code " + responseCode);
            con.disconnect();
            return "";
        }
    }

    private static int generateInsert(PreparedStatement preparedStatement,
                                      Integer codigoPais,
                                      String nombrePais,
                                      String capitalPais,
                                      String region,
                                      Long poblacion,
                                      Double latitud,
                                      Double longitud) throws SQLException {

        if (nombrePais.length() > 50 || capitalPais.length() > 50 || region.length() > 50) {
            return 0;
        }

        preparedStatement.setInt(1, codigoPais);
        preparedStatement.setString(2, nombrePais);
        preparedStatement.setString(3, capitalPais);
        preparedStatement.setString(4, region);
        preparedStatement.setLong(5, poblacion);
        preparedStatement.setDouble(6, latitud);
        preparedStatement.setDouble(7, longitud);

        int rows = preparedStatement.executeUpdate();
        if(rows > 0) {
            integerHashSet.add(codigoPais);
        }
        return rows;
    }

    public static JsonArray getJsonArray(String jsonString) {
        JsonParser jsonParser = new JsonParser();
        return jsonParser.parse(jsonString).getAsJsonArray();
    }

}
