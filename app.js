const express = require('express')
const app = express()
const port = 3000
const bodyParser=require("body-parser")
var mysql = require('mysql');
const cheerio = require('cheerio')
const got = require('got');
const hbs=require('hbs')

app.use(express.static(__dirname + "/static/css"));
app.use(express.static(__dirname + "/static/js"));
app.set('views', __dirname + '/templates');
//app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.urlencoded({extended: true}));
app.use(express.json())

app.get("/", function (req, res) {
    res.render(__dirname + "/templates/login.html");
});

app.post('/', (req, res) => {
    var username=(req.body.username)
    console.log(username)
    var password=(req.body.password)
    console.log(password)
    
    var connection = mysql.createConnection({
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "electron"
    });

    // connect to mysql
    connection.connect(function (err) {
        // in case of error
        if (err) {
            console.log(err.code);
            console.log(err.fatal);
        }
    });

    $query= (`SELECT user_id FROM accounts WHERE username="${username}" AND password="${password}"`);

    connection.query($query, function (err, rows, fields) {
        if (err) {
            console.log("An error occurred performing the query.");
            console.log(err);
            return;
        }
        if(rows.length==0){
            console.log("Incorrect username or password!")
            res.render(__dirname + "/templates/login.html", {msg: "Incorrect username or password!"});
        }
        
        else{
            console.log(rows)
            var user_id=(rows[0]['user_id'])
            console.log(username, user_id)
            app.set("username", username)
            app.set("user_id", user_id)
            console.log("Query successfully executed");
            res.redirect("/query")
        }
    });

    connection.end(function () {
        // The connection has been closed
    });
});

app.get("/register", function(req, res){
  res.render(__dirname + "/templates/register.html");
})

app.post("/register", function(req, res){
  var username=(req.body.username)
  console.log(username)
  var password=(req.body.password)
  console.log(password)
  var email=(req.body.email)
  console.log(email)

  var connection = mysql.createConnection({
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "electron"
  });

  // connect to mysql
  connection.connect(function (err) {
    // in case of error
    if (err) {
        console.log(err.code);
        console.log(err.fatal);
    }
  });

  console.log((`SELECT * FROM accounts WHERE username="${username}"`))
  $query= (`SELECT * FROM accounts WHERE username="${username}"`);

  connection.query($query, function (err, rows, fields) {
    if (err) {
        console.log("An error occurred performing the query.");
        console.log(err);
        return;
    }
    console.log(rows)
    console.log(rows.length)
    
    if (rows.length==0) {
      $query = 'INSERT INTO accounts(username, password, email) VALUES ("' + username + '", "' + password + '", "' + email + '");';

      connection.query($query, function (err, rows, fields) {
        if (err) {
          console.log("An error occurred performing the query.");
          console.log(err);
          return;
        }
        console.log("User successfully registered!")
        console.log("Query successfully executed");
        res.redirect("/")
      });
    }

    else {
      console.log("Username already exists!")
      res.render(__dirname + "/templates/register.html", {msg: "User already exists!"});
    }
    
    connection.end(function () {
        // The connection has been closed
    });

  })
})

app.get("/query", async function (req, res) {
    var username=app.get("username")
    var user_id=app.get("user_id")
    getQueries((user_id), function (data, err) {
      if (err) {
        console.log(err);
      }

      else if(data.length!=0) {
        console.log(data);
        res.render(__dirname + "/templates/index.html", {username: app.get("username"), queries: (data), rows: true});
        console.log(username, user_id)
      }

      else {
        res.render(__dirname + "/templates/index.html", {username: app.get("username"), queries: "", rows: false});
      }
    })
});

app.post('/query', async function (req, res) {
    var inputValue = req.body.indexSubmit;
    var query=(req.body.query)
    var maxTime=req.body.maxTime
    console.log(inputValue,query)
    console.log(req.body.maxTime)
    if(inputValue=="search") {
      query=query.replace(' ','+')
      await getData(query, maxTime)
      res.redirect("/result")
    }
    else if(inputValue=="saveQuery") {
      //saveQuery(query, maxTime)
      
      saveQuery(query, maxTime, function (data, err) {
        if (err) {
          console.log(err);
        }
        else {
          res.redirect('back');
        }
      })
    }
});

app.get("/result", function (req, res) {
    console.log(app.get("news"))
    res.render(__dirname + "/templates/result.html", {news: (app.get("news"))});
});

app.post("/delete-query", function(req, res) {
  var delQuery=(req.body.delQuery)
  var delTime=(req.body.delTime)
  var user_id=app.get("user_id")
  var connection = mysql.createConnection({
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "electron"
  });

  // connect to mysql
  connection.connect(function (err) {
      // in case of error
      if (err) {
          console.log(err.code);
          console.log(err.fatal);
      }
  });

  console.log(`DELETE FROM queries WHERE user_id="${user_id}" AND query="${delQuery}" AND time="${delTime}"`)
  $query= (`DELETE FROM queries WHERE user_id="${user_id}" AND query="${delQuery}" AND time="${delTime}"`);

  connection.query($query, function (err, rows, fields) {
    if (err) {
        console.log("An error occurred performing the query.");
        console.log(err);
        return;
    }
    else {
      console.log("Query successfully deleted!")
    }

    console.log(rows)
    console.log(rows.length)

    connection.end(function () {
      // The connection has been closed
    });
  })
  res.redirect("back");  
})

app.post("/logout", function (req, res) {
  app.delete("username")
  app.delete("user_id")
  res.redirect("/")
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

async function saveQuery(query, maxTime, callback) {
  var query_name=query
  var time=maxTime
  var user_id=app.get("user_id")
  var connection = mysql.createConnection({
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "electron"
  });

  // connect to mysql
  connection.connect(function (err) {
      // in case of error
      if (err) {
          console.log(err.code);
          console.log(err.fatal);
      }
  });

  console.log(`SELECT * FROM queries WHERE user_id="${user_id}" AND query="${query_name}" AND time="${time}"`)
  $query= (`SELECT * FROM queries WHERE user_id="${user_id}" AND query="${query_name}" AND time="${time}"`);

  connection.query($query, function (err, rows, fields) {
    if (err) {
        console.log("An error occurred performing the query.");
        console.log(err);
        callback(err)
    }
    console.log(rows)
    console.log(rows.length)
  
  if (rows.length==0) {
    $query = 'INSERT INTO queries(user_id, query, time) VALUES ("' + user_id + '", "' + query_name + '", "' + time + '");';

    connection.query($query, function (err, rows, fields) {
        if (err) {
            console.log("An error occurred performing the query.");
            console.log(err);
            callback(err)
        }
        else {
          console.log("Query successfully executed");
          callback(rows)
        }
    });
    }
    else {
      console.log("Query already exists!")
      callback(user_id)
    }
    
    connection.end(function () {
        // The connection has been closed
    });
    //window.location.reload()
  })
}

async function getQueries(user_id, callback) {
  var connection = mysql.createConnection({
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "electron"
  });

  // connect to mysql
  connection.connect(function (err) {
    // in case of error
    if (err) {
        console.log(err.code);
        console.log(err.fatal);
    }
  });

  $query= (`SELECT * FROM queries WHERE user_id="${user_id}"`);

  connection.query($query, function (err, rows, fields) {
    if (err) {
        console.log("An error occurred performing the query.");
        console.log(err);
        callback(err);
    }
    if(rows.length==0){
        console.log("No saved queries!")
        console.log(rows)
        callback(rows)
    }
    
    else{
        console.log(rows)
        console.log("Query successfully executed");
        callback(rows)
    }
  });

  connection.end(function () {
    // The connection has been closed
  });
}


async function getData (query, maxTime) {
	try {
		const response = await got('https://google.com/search?q=' + query + '&tbm=nws');
		//console.log(response.body);
    extractLinks(response.body, maxTime)
    return response.body
	} catch (error) {
		console.log(error.response.body);
	}
};

let extractLinks = function (html, maxTime) {
  const $ = cheerio.load(html)
  var news={}
  var dict={}
  var count=0
  
  $('div[class="ZINbbc xpd O9g5cc uUPGi"]').each((i, element) => {
    dict={}
    let link=$(element)
    .find('a').first().attr('href').substring(7,);
    
    let headline = $(element)
    .find('.zBAuLc').text()
    
    let source = $(element)
    .find('.UPmit').text()
    
    let time_meta = $(element)
    .find('.s3v9rd').first().text()
    
    let time=time_meta.substring(0,time_meta.indexOf('ago')+3)

    let time_comp=parseInt(time.substring(0,time.indexOf(" ")))
    
    if(time.includes("minutes") || time.includes("minute")){
      time_comp=time_comp/60
    }
    
    if(time.includes("days") || time.includes("day")){
      time_comp=time_comp*24
    }
    
    if(time.includes("weeks") || time.includes("week")){
      time_comp=time_comp*168
    }
    
    if(time.includes("months") || time.includes("month")){
      time_comp=time_comp*168*28
    }

    let meta=time_meta.substring(time_meta.indexOf('ago')+6,)
    link=link.substring(0,link.indexOf('&sa'))
    
    if(time_comp<=maxTime){
      dict["headline"]=headline
      dict["link"]=link
      dict["source"]=source
      dict["time"]=time
      dict["meta"]=meta
      console.log(dict)
      news[count]=(dict)
      count=count+1
    }
  })
  console.log(news)
  app.set("news", news)
}