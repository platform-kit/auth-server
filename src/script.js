
var selectedList = [];

function next(selected){
	var sections =  document.getElementsByTagName('section');
	var i;

	if(typeof(selected)==="string"){
		selected = document.getElementById(selected);
	}
	else if(!selected){
		for(i=0;i<sections.length;i++){
			if(sections[i].className.match("selected")){
				selected = sections[i+1];
				break;
			}
		}
	}

	selectedList.push(selected);

	for(i=0;i<sections.length;i++){
		if(sections[i] !== selected ){
			sections[i].className = (sections[i].className||'').replace(/selected/g, '');
		}
	}

	selected.className = ( selected.className || '' ) + ' selected';

	return;
}


function back(){
	var i = selectedList.length-2;
	if(i>=0){
		next(selectedList[i]);
	}
}

function toggle(el){
	if(typeof(el)==='string'){
		el = document.getElementById(el);
	}
	// element style
	var display = el.style.display;

	// get computed style
	if(!display){
		try{
			display = window.getComputedStyle(el, null).getPropertyValue("display");
		}catch(e){

		}
	}

	el.style.display = (display==="none"?"block":"none");
}

window.onresize = function(){
	document.body.style.height = window.innerHeight + "px";
	document.body.style.width = window.innerWidth + "px";
};

window.onresize();

next("home");

if(window.location.hash&&window.location.hash.match('state=')){
	next();
}



hello.subscribe('auth.login', function(auth){
	hello.api(auth.network+":me", function(o){
		if(!o||o.error){
			return;
		}

		// Show the form
		$("form").addClass('selected');

		var len = $('form input[name=admin_id]').length;

		// Add item to form
		$("<input/>").attr({
			'id' : auth.network,
			'type' :'radio',
			'name'	: 'admin_id',
			'checked' : len===0
		}).val(o.id + "@" + auth.network).appendTo('.accounts');


		$("<label>").attr({
			'for' : auth.network
		}).html("<img src='"+o.thumbnail+"' /><b>" + o.name + "</b> at " + auth.network).appendTo('.accounts');

		$("<br/><br/>").appendTo('.accounts');

	});
});

hello.init(CLIENT_IDS, {
	redirect_uri : "/",
	display : "page",
	oauth_proxy : "/proxy"
});

// Has the user ever signed in?
if(hello.getAuthResponse()){
	next("register");
}

//
// ADD EVENTS TO LOGIN BUTTONS
//
$('#signin > button').click(function(){
	hello.logout(this.getAttribute('data-network'));
	hello.login(this.getAttribute('data-network'), {state:{
		prefill_network : prefill.network,
		prefill_client_id : prefill.client_id,
		error : prefill.error
	}});
});


//
// PREFILL THE FORM
//
var prefill = {};
if(window.location.hash){
	prefill = hello.utils.param(window.location.hash);
}
if(window.location.search){
	prefill = hello.utils.merge( prefill, hello.utils.param(window.location.search) );
}
if(prefill.state){
	var json = JSON.parse(prefill.state);
	prefill = {
		network:json.prefill_network,
		client_id:json.prefill_client_id,
		error:json.error
	};
}

for(var x in prefill){
	$("."+x).text(prefill[x]);
}


// Wait?
if(prefill.error==='consumer_key_unknown'){
	next("fatal");
}

$("#register form input").each(function(){
	if(this.name in prefill && prefill[this.name] ){
		this.value = prefill[this.name];
		this.setAttribute('readonly',true);
	}
});


//
// ADD FORM SUBMIT EVENTS
//
$("form").on("change","input[name=admin_id]",function(){
	if($(this).is(":checked")){
		var self = this;
		$("form input[name=admin_id]").filter(function(){
				return $(this).val() === $(self).val();
			}).attr('checked', true);
	}
});


$("#signin form").submit(function(e){
	e.preventDefault();
	next();
});


$("#register form").submit(function(e){
	$("#error").text("");
	e.preventDefault();
	$.post("/rest", $(this).serialize(), function(data,res){

		if(typeof(data)==='string'){
			data = JSON.parse(data);
		}

		if(data.success){
			next();
			$("section.selected h2").text("Successfully "+ data.success +" application");
		}
		else{
			$("#error").text(data.error);
		}
	});
});