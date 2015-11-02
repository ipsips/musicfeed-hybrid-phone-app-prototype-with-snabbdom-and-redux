var express = require('express'),
    // ejs = require('ejs'),
    app = module.exports = express(),
    port = process.argv[2] || 5551;

// app.set('view engine', 'html');
// app.engine('html', ejs.renderFile);

app.use(function allowOrigin(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

app.use(express.static(__dirname+'/www'));

app.get('/fake-api/:endpoint', function (req, res) {
	setTimeout(function () {
		res.header('Access-Control-Allow-Origin', '*');
	    res.sendFile(__dirname+'/fake-api/'+req.params.endpoint);
	}, 1500);
});

app.get('/:phoneSize?', function (req, res) {
	res.sendFile(__dirname+'/www/index.html');
    // res.render(__dirname+'/www/index.html', {
    // 	phoneSize: req.params.phoneSize
    // });
});

//  All other undefined routes should return a 404
app.use(function (req, res) {
    res.status(404).send('<h1>404: Not Found</h1>');
});

app.listen(port, function () {
    console.log('Express server listening on port '+port);
});