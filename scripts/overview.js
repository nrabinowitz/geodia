$(document).ready(function(){
	var counts = {sites: 0, images: 0, periods: 0};
	
	function add_to_counts(data){
		counts.sites += 1;
		counts.images += data.images;
		counts.periods += data.periods;
	};

	var template = '<tr><td>${metadata.site_name}</td><td>${periods}</td><td>${images}</td></tr>';	
	$.getJSON('scripts/sites.json',function(data){
		$.tmpl(template,data).appendTo('#site_table');
		for(var i in data){
			add_to_counts(data[i]);
		}
		$('<tr class="totals"><td>'+counts.sites+'</td><td>'+counts.periods+'</td><td>'+counts.images+'</td></tr>').appendTo('#site_table');	

	});
});
