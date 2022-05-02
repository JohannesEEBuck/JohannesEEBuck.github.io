/* French initialisation for the jQuery UI date picker plugin. */
/* Written by Keith Wood (kbwood{at}iinet.com.au),
              StÃ©phane Nahmani (sholby@sholby.net),
              StÃ©phane Raimbault <stephane.raimbault@gmail.com> */
jQuery(function($){
	$.datepicker.regional['fr'] = {
		closeText: 'Fermer',
		prevText: 'Précédent',
		nextText: 'Suivant',
		currentText: 'Aujourd\'hui',
		monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin',
		'Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
		monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin',
		'Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
		dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
		dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
		dayNamesMin: ['D','L','M','M','J','V','S'],
		weekHeader: 'Sem.',
		dateFormat: 'dd/mm/yy',
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: false,
		yearSuffix: '',
        
        year: 'Année',
        prevYear: 'Année précédente',
        nextYear: 'Année suivante',
        next12Years: 'Années suivantes',
        prev12Years: 'Années précédentes',
        nextLabel: 'Suivant',
        prevLabel: 'Précédent',
        buttonText: 'Sélectionner un mois',
        jumpYears: 'Choisir l\'année',
        backTo: 'Retour à',
        months: ['Jan.', 'Fév.', 'Mar.', 'Avr.', 'Mai', 'Juin', 'Jui.', 'Août', 'Sep.', 'Oct.', 'Nov.', 'Déc.']};
	$.datepicker.setDefaults($.datepicker.regional['fr']);
});
