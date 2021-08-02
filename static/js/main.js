const cheerio = require('cheerio')
const { ipcRenderer } = require('electron')
const got = require('got');
var res=""    

let extractLinks = function (html, maxTime) {
  console.log(html)
  const $ = cheerio.load(html)
  var news={}
  var dict={}
  console.log($)
  console.log($('div[class="ZINbbc xpd O9g5cc uUPGi"]'))
  var count=0
  
  $('div[class="ZINbbc xpd O9g5cc uUPGi"]').each((i, element) => {
    console.log($(element))
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
    
    console.log((headline))
    console.log(link)
    console.log((source))
    console.log((time))
    console.log((meta))
    console.log(time_comp)
    
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
  sessionStorage.setItem("news", JSON.stringify(news))
  //window.location.href="./result.html"
  ipcRenderer.send('scrapeurl', news);
}

async function getgot (query, maxTime) {
	try {
		const response = await got('https://google.com/search?q=' + query + '&tbm=nws');
		console.log(response.body);
    extractLinks(response.body, maxTime)
    return response.body
	} catch (error) {
		console.log(error.response.body);
	}
};

var username=sessionStorage.getItem("username")
document.getElementById("username").innerHTML="Welcome "+username

ipcRenderer.on('user', (event, username) => {
  console.log(username)
})

document.querySelector('#submitQuery').addEventListener('submit', function (event) {
  event.preventDefault();
  let query=document.getElementById("query").value
  query=query.replace(' ','+')
  var maxTime=document.querySelector('input[name="max-time"]:checked').value;
  getgot(query, maxTime)
})

document.querySelector('#logout').addEventListener('click', function (event) {
  sessionStorage.removeItem("username")
  window.location.href="login.html"
})

document.querySelector('#saveQuery').addEventListener('click', function (event) {
  event.preventDefault()
  var user_id=sessionStorage.getItem("user_id")
  console.log(user_id)
  var query_name=document.getElementById("query").value
  var time=document.querySelector('input[name="max-time"]:checked').value;
  var mysql = require('mysql');
        var config = require("../db-config");

        var connection = mysql.createConnection(config.db);

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
              return;
          }
          console.log(rows)
          console.log(rows.length)
        
        if (rows.length==0) {
          $query = 'INSERT INTO queries(user_id, query, time) VALUES ("' + user_id + '", "' + query_name + '", "' + time + '");';

        connection.query($query, function (err, rows, fields) {
            if (err) {
                console.log("An error occurred performing the query.");
                console.log(err);
                return;
            }
            console.log("Query successfully executed");
        });
        }
        else {
          alert("Query already exists!")
        }
        
        connection.end(function () {
            // The connection has been closed
        });

        window.location.reload()
      })
})

function getQueries() {
  console.log("executed")
  var user_id=sessionStorage.getItem("user_id")
  console.log(user_id)
  var mysql = require('mysql');
  var config = require("../db-config");

  var connection = mysql.createConnection(config.db);

  // connect to mysql
  connection.connect(function (err) {
      // in case of error
      if (err) {
          console.log(err.code);
          console.log(err.fatal);
      }
  });

  console.log(`SELECT * FROM queries WHERE user_id="${user_id}"`)
  $query= (`SELECT * FROM queries WHERE user_id="${user_id}"`);

  connection.query($query, function (err, rows, fields) {
    if (err) {
        console.log("An error occurred performing the query.");
        console.log(err);
        return;
    }
    console.log(rows)
    console.log(rows.length)
    if (rows.length!=0) {
      var result=document.getElementById("displayQueries")  
      result.innerHTML=""  
      
      for(element in rows) {
        var queryText = document.createElement('div');
        var timeText = document.createElement('div');
        var cancel=document.createElement("a")
        cancel.textContent="X"
              
        queryText.textContent="Query- "+rows[element]["query"]
        timeText.textContent=rows[element]["time"]
        if(timeText.textContent=="24") {
          timeText.textContent="Daily"
        }
        else {
          timeText.textContent="Weekly"
        }
        var queries=rows[element]["query"]
        var times=(rows[element]["time"])
        res+="<li class='cancel'><span class='cross'>X </span>"+"<span class='queryData'>"+queries+"</span>"+"   -   "+"<span class='timeData' value='times'>"+timeText.textContent+"</span>"+"</li><br>";
    
      }
      result.innerHTML=res
    }
    else {
      alert("No saved queries!")
    }
    connection.end(function () {
        // The connection has been closed
    });

  })
}

window.onload = function() {
  getQueries();
}

$('#displayQueries').on("click", ".cross", function() {
  var delQuery=($(this).next('.queryData').text());
  var delTime=($(this).nextAll('.timeData').text());
  if (delTime=="Daily") {
    delTime=24
  }
  else if (delTime=="Weekly") {
    delTime=168
  }
  console.log(delQuery, delTime)
  var user_id=sessionStorage.getItem("user_id")
  console.log(user_id)
  var mysql = require('mysql');
  var config = require("../db-config");
  var connection = mysql.createConnection(config.db);

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
    window.location.reload()
  })
});