/* German initialisation for the jQuery UI date picker plugin. */
/* Written by Milian Wolff (mail@milianw.de). */
jQuery(function($){
	$.datepicker.regional['de'] = {
		closeText: 'Schließen',
		prevText: 'Früher',
		nextText: 'Nächste',
		currentText: 'heute',
		monthNames: ['Januar','Februar','März','April','Mai','Juni',
		'Juli','August','September','Oktober','November','Dezember'],
		monthNamesShort: ['Jan','Feb','Mär','Apr','Mai','Jun',
		'Jul','Aug','Sep','Okt','Nov','Dez'],
		dayNames: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
		dayNamesShort: ['So','Mo','Di','Mi','Do','Fr','Sa'],
		dayNamesMin: ['So','Mo','Di','Mi','Do','Fr','Sa'],
		weekHeader: 'KW',
		dateFormat: 'dd.mm.yy',
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: false,
		yearSuffix: '',
        
        year: 'Jahr',
        prevYear: 'Vorheriges Jahr',
        nextYear: 'Nächstes Jahr',
        next12Years: 'Folgenden Jahren',
        prev12Years: 'Vorjahre',
        nextLabel: 'Nächste',
        prevLabel: 'Früher',
        buttonText: 'Öffnen Monat Chooser',
        jumpYears: 'Die Jahre',
        backTo: 'Zurück zu',
        months: ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.']};
	$.datepicker.setDefaults($.datepicker.regional['de']);
});
