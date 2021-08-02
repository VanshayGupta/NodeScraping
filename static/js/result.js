
  console.log(document.getElementById("news"))
  console.log(JSON.parse(document.getElementById("news")));
  var result=document.getElementById("result")
  result.textContent=""
  for(element in news) {
    var headlineText = document.createElement('a');
    var sourceText = document.createElement('div');
    var dateText = document.createElement('div');
    var metaText = document.createElement('div');
    var linkText = news[element]["link"]
    headlineText.href=linkText
    headlineText.textContent=news[element]["headline"]
    sourceText.textContent=news[element]["source"]
    dateText.textContent=news[element]["time"]
    metaText.textContent=news[element]["meta"]
    result.appendChild(headlineText)
    result.appendChild(sourceText)
    result.appendChild(dateText)
    result.appendChild(metaText)
    result.appendChild(document.createElement('br'));
  }

