exports.runServer = function() {
    // Load the http module to create an http server.
    var http = require('http');
    var fs = require('fs');

    // Configure our HTTP server to respond with Hello World to all requests.
    var httpServer = http.createServer(function(request, response) {
        response.writeHead(200, {
            "Content-Type": "text/plain"
        });
        response.end("User Name: Purvil Patel");
    });

    // Listen on port 8000, IP defaults to 127.0.0.1
    httpServer.listen(8000);

    // Put a friendly message on the terminal
    console.log("Server running at http://127.0.0.1:8000/");

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

    function executeStatement() {
        var request = new Request("insert into dbo.users values(125, 'Purvil', 'Patel', '272');", function(err, rowCount) {
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