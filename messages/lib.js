// add newline to console
exports.newLine = function() {
    console.log("\n");
}

exports.saveToDB = function(username, address, pizza) {

    var Connection = require('tedious').Connection;
    var config = {
        userName: 'pizzabotservicedb',
        password: 'Pizza#Bot',
        server: 'pizzabotservicedb.database.windows.net',
        // When you connect to Azure SQL Database, you need these next options.  
        options: {
            encrypt: true,
            database: 'pizzabotservicedb'
        }
    };
    var connection = new Connection(config);
    connection.on('connect', function(err) {
        // If no error, then good to proceed.  
        console.log("Connected");
        executeStatement();
    });

    var Request = require('tedious').Request;
    var dateFormat = require('dateformat');
    var time = dateFormat(new Date() - 18000000, "mm-dd-yyyy hh:MM TT");

    function executeStatement() {
        var query = "insert into dbo.orders values( " +
            "'" + username + "'," +
            " '" + address + "'," +
            " '" + time + "'," +
            " '" + pizza.size + "'," +
            " '" + pizza.crust + "'," +
            " '" + pizza.toppings + "'," +            
            " '" + pizza.sauce + "'," +
            " '" + pizza.price + "');";
           
        console.log(query);
        var request = new Request(query, function(err, rowCount) {
            if (err) {
                console.log(err);
            } else {
                console.log(rowCount + ' rows');
            }
        });

        request.on('row', function(columns) {
            columns.forEach(function(column) {
                console.log(column.value);
            });
        });

        connection.execSql(request);
    }
}

// add delimiter line to console
exports.delimiterLine = function() {
    console.log("\n*****************************\n");
}

// return empty pizza object
exports.getEmptyPizza = function(text) {
    var pizza = new Object();
    pizza.size = "";
    pizza.crust = "";
    pizza.sauce = "";
    pizza.toppings = "";
    pizza.price = 0;

    return pizza;
}

// parse entities identified by LUIS and update the pizza object
exports.parsePizza = function(pizza, entities) {
    for (var i = 0; i < entities.length; i++) {
        var entity = entities[i];
        switch (entity.type) {
            case 'Size':
                pizza.size = entity.entity;
                pizza = setSizePrice(pizza, pizza.size.toUpperCase());
                break;
            case 'Crust':
                pizza.crust = entity.entity;
                break;
            case 'Sauce':
                pizza.sauce = entity.entity;
                break;
            case 'Toppings':
                pizza.toppings += entity.entity + ", ";
                break;
                /*case 'builtin.number':
            	pizza.quantity = entity.entity;
                break;
            */
        }
    }
    return pizza;
}

// polish pizza, remove unncessary charecters
exports.polishPizza = function(pizza) {
    if (pizza.toppings) {
        pizza.toppings = removeChar(pizza.toppings, ',');
    }
    if (pizza.sauce) {
        pizza.sauce = removeChar(pizza.sauce, ',');
    }
    return pizza;
}

// return user readable pizza string
exports.userReadablePizzaString = function(pizza) {
    var returnString = "You have ordered one ";
    if (pizza.size) {
        returnString += pizza.size;
    }
    if (pizza.crust) {
        returnString += " " + pizza.crust;
    }
    returnString += " pizza";
    if (pizza.sauce) {
        returnString += " with " + pizza.sauce + " sauce and ";
    } else {
        returnString += " with ";
    }
    if (pizza.toppings) {
        returnString += pizza.toppings + " toppings.";
    }
    if (pizza.price) {
        returnString += " Your bill is $" + pizza.price + ".";
    }
    return returnString;
}


// remove charecter
function removeChar(str, char) {
    if (str.includes(char)) {
        return str.substr(0, str.lastIndexOf(char));

    }
    return str;
}

// get price for size
function setSizePrice(pizza, size) {
    switch (size) {
        case 'LARGE':
        case 'FAMILY':
            pizza.price += 15;
            break;

        case 'SMALL':
        case 'SINGLE':
            pizza.price += 5;
            break;

        case 'MEDIUM':
            pizza.price += 10;
            break;
    }
    return pizza;
}