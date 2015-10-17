var express = require('express'),
    app = module.exports = express(),
    port = process.argv[2] || 5151;

app.use(express.static(__dirname+'/www'));

app.get('/', function renderFrontPage(req, res) {
    res.sendFile(__dirname+'/www/index.html');
});

app.get('/fake-api/:endpoint', function renderFrontPage(req, res) {
	function send() {
	    res.sendFile(__dirname+'/fake-api/'+req.params.endpoint);
	}
	setTimeout(send, 3000);
});

//  All other undefined routes should return a 404
app.use(function (req, res) {
    res.status(404).send('<h1>404: Not Found</h1>');
});

app.listen(port, function () {
    console.log('Express server listening on port '+port);
});