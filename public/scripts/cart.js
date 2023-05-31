var request = new XMLHttpRequest(), STATUS_OK = 200;
var pop = document.getElementById("item-desc");
var main_cart = document.getElementById("main_cart");
var modal = document.getElementsByClassName("modal")[0];
var close = document.getElementById("close");
var btn = document.getElementsByClassName("desc-button btn-success")[0] ?? document.getElementsByClassName("desc-button btn-danger")[0] ;


close.addEventListener("click", abc);

function abc()
{
    modal.style.display = "none";
    pop.style.display = "none";
}

function removeCart(id)
{
    try
    {
        id = id[0].attributes.id.nodeValue;
    }
    catch
    {
        id = id; //remains same
    }
    request.open('POST','/status');
    request.setRequestHeader("Content-type","application/json");
    request.send(JSON.stringify({id: id}));

    request.onload = function()
    {
        var res = JSON.parse(request.response);
        if(res.status === 200)
        {
            main_cart.removeChild(document.getElementById(id));
            pop.style.display = "none";
            abc();
        }
        else{
            alert("error occured while removing product from cart");
        }
    }
}

function desc(id)
{
    request.open('POST', '/desc');
    request.setRequestHeader("Content-type","application/json");
    request.send(JSON.stringify({id: id}));

    request.onload = function()
    {
        var res = JSON.parse(request.response);
        var isNeed = res.isNeed;
        res = res.message[0];
        console.log(res,isNeed);
        var img = document.getElementById("item-img");
        var desc = document.getElementById("desc");
        
        set_desc_button(id);
        
        
        modal.style.display  = "block";
        img.setAttribute('src', res.pic);
        desc.innerText = res.desc;
        pop.style.display = "block";
    }
}

function set_desc_button(id)
{    
    btn.setAttribute("class", "desc-button btn-danger");
    btn.innerHTML = "Remove from cart";

    btn.setAttribute("onclick", "removeCart("+id+")");
    // console.log(btn)         
}

function plus(id)
{
    request.open('POST','/addMinus');
    request.setRequestHeader("Content-type","application/json");
    request.send(JSON.stringify({id: id,add:1}));

    request.onload = function()
    {
        var res = JSON.parse(request.response);
        if(res.status ===200)
        {
            var inc = document.getElementById(id+"qty");
            inc.innerText =  parseInt(inc.innerText) + 1;
        }
    }
}

function minus(id)
{
    var inc = document.getElementById(id+"qty");
    if(parseInt(inc.innerHTML) > 1)
    {
        request.open('POST','/addMinus');
        request.setRequestHeader("Content-type","application/json");
        request.send(JSON.stringify({id: id,add:-1}));

        request.onload = function()
        {
            var res = JSON.parse(request.response);
            if(res.status === 200)
            {
                inc.innerHTML =  parseInt(inc.innerHTML) - 1;
            }
        }
    }
    else
    {
        alert("The quantity must be one minimum.");
    }
}

function checkOut()
{
    // console.log("sdjbhcj")
    request.open('POST','/checkout');
    request.send();

    request.onload = function()
    {
        // var res = JSON.parse(request.response);
        var res = JSON.parse(request.response);
        alert("Your total amount of products is : Rs "+ res.total);
    }
}