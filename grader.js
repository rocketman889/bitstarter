#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var sys = require('util');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "";
var urlIsSaved = false;

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(submittedUrl){
    var instr = submittedUrl.toString();
    fetchUrl(instr);
    return instr;
};

var fetchUrl = function (url){
    console.log('in the assert URL function. submitted URL: ' + url); 
    rest.get(url).on('complete', function(result){
	if(result instanceof Error){
console.log('Error: ' + result.message);	    
//sys.puts('Error: ' + result.message);
	    this.retry(4000);
	  }else{
	      console.log('about to save the html file to: ' + __dirname + '/temp.html');
	      fs.writeFile(__dirname + '/temp.html', result, function(err){
		  if(err)
		  {		      
		      throw err;
		  }else{
		      console.log('It\'s saved!');
		      urlIsSaved = true;
		      //DOn't do anything until is all loaded...
		  }
	      });
	  }
	});
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile, urlfile) {
    var theFile = htmlfile;
console.log('in the checkHTMLFile. URL: ' + urlfile);
    if(urlfile===""){
	//It was a local html file, then carry on with the path to the htmlfile
	console.log('It is the html file with a path of: ' + htmlfile);
    }else{
	//It was a URL. You need to wait until the file is created and then pass the file through
	theFile = __dirname + '/temp.html';

	console.log('it is a url with the path of: ' + theFile);
    }
    if(urlIsSaved){
	$ = cheerioHtmlFile(theFile);
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for(var ii in checks) {
            var present = $(checks[ii]).length > 0;
            out[checks[ii]] = present;
	}
	return out;
	}
};

var outputJSON(){
  var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url_link>', 'Path to url', clone(assertUrlExists), URL_DEFAULT)
        .parse(process.argv);

  
  if(program.url === ""){
        var checkJson = checkHtmlFile(program.file, program.checks);
      outputJSON();//output the JSON file for if a file was passed for testing
  }else{
      var checkJson = checkUrlFile(program.url, program.checks);
      //outputJSON is in the async function.
  }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
