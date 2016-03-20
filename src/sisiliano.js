(function(config, $, window) {
	//#################################################
	//     Browser Compatibility Settings
	//#################################################
	
		// Opera 8.0+
	var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
		// Firefox 1.0+
	var isFirefox = typeof InstallTrigger !== 'undefined';
		// At least Safari 3+: "[object HTMLElementConstructor]"
	var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
		// Internet Explorer 6-11
	var isIE = /*@cc_on!@*/false || !!document.documentMode;
		// Edge 20+
	var isEdge = !isIE && !!window.StyleMedia;
		// Chrome 1+
	var isChrome = !!window.chrome && !!window.chrome.webstore;
		// Blink engine detection
	var isBlink = (isChrome || isOpera) && !!window.CSS;
	
	var filterAddedClasses = [
		{
			selector: '.sisiliano .ctrl .ctrl-circle.ctrl-circle-background',
			values: {
				filter: '#filter6244'
			}
		},
		{
			selector: '.sisiliano .ctrl .ctrl-circle.ctrl-circle-cover',
			values: {
				filter: '#filter6244'
			}
		},
		{
			selector: '.sisiliano:focus .ctrl .ctrl-circle',
			values: {
				filter: '#filter6245'
			}
		}
	];
	
	$(document).ready(function() {
		templates.get('filters.svg').then(function(svgFilters) {
			var newStyle = "";
		
			if (isFirefox) {
				//A fix for firefox
				for (var i = 0; i < filterAddedClasses.length; i++) {
					newStyle += filterAddedClasses[i].selector
									+ " { filter: url('data:image/svg+xml;utf8," 
									+ svgFilters.replace(/\n|\r|\t/g, ' ').replace(/ * /g, ' ').replace(/\"/g, '\\"') 
									+ filterAddedClasses[i].values['filter']
									+ "'); }\n";
				}
				
				$("head").append('<style type="text/css">\n' + newStyle + '\n</style>');
			}
			
			$('body').append(svgFilters);
		});
	});
	
	
	//#################################################
	//     Template service
	//#################################################
	var templates = (function(templatesPath) {
		//template cache
		var _templatesMap = {
			'ringCtrl.svg': null
		};
		
		return {
			get: function(templateName) {
				var promise = jQuery.Deferred();
				
				if (_templatesMap[templateName]) {
					promise.resolve(_templatesMap[templateName]);
				} else {
					var request = $.get(config.templates + templateName)
					request.then(function(data) {
						_templatesMap[templateName] = $(data.firstChild).html();
						promise.resolve(_templatesMap[templateName]);
					});
					request.error(function() {
						promise.reject("Template [" + templateName + "] cannot be loaded");
					});
				}
				
				return promise;
			}
		};
	})(config.templates);
	
	
	//#################################################
	//     Ring Controller
	//#################################################
	var ringCtrl = (function() {
		function validateOptions(options, input) {
			for (var key in options) {
				if (input[key] !== undefined) {
					options[key] = input[key];
				}
			}
			
			if (!options.value || typeof options.value !== "number" || options.value === NaN || options.value > 100 || options.value < 0) {
				options.value = 0;
			}
			options.value = Math.round(options.value);
		}
		
		function updateValue(model) {
			if (typeof model.value != "number") {
				model.value = model.options.value;
			} else if (model.value > 100) {
				model.value = 100;
			} else if (model.value < 0) {
				model.value = 0;
			} 
			
			
			if (model.value <= 100 && model.value >= 0) {
				$(model.element).find('.ctrl-circle-value')[0].innerHTML = model.value + "%";
				
				var offset = ((model.circumference / 100) * (100 - model.value)) + 'px';
				$(model.element).find('.ctrl-circle-cover').attr('stroke-dashoffset', offset);
			}
		}
		
		var ringCtrl =function(parent, customOptions) {
			//Default options which can be overriden by the user
			var options = {
				id: null,
				accentColor: "blue",
				coverColor: null,
				textColor: null,
				value: 0
			};
			
			//Model of the ring controller
			var model = {
				options: options,
				
				//DOM element of the ring controller
				element: null,
				
				//Status of the element
				status: {
					
					//Previous position of mouse (This is used to mouse event to controll the value)
					prev: {}
				},
				
				//Content element of the ring slider controller
				innerElement: null,
				
				//Displaying value of the ring
				value: null,
				
				radius: 130,
				circumference: null
			};
			
			validateOptions(options, customOptions);
			
			/**
			 * Initialize the DOM
			 */
			function draw(ringCtrlHtml) {
				model.element = $('<div tabindex="0" class="sisiliano" ' 
											+ 'role="slider" aria-label="Ring Slider" aria-valuemax="100" aria-valuemin="0"/>')
											.append(ringCtrlHtml);
				model.innerElement = model.element.find('.ctrl');
				
				$(model.element).on('load', function() {
					var circleRadius = eval(model.element.find('.ctrl-circle').attr('r'));
					model.radius = circleRadius;
					model.circumference = 2 * model.radius * Math.PI; 
					$(this).find('.ctrl-circle').attr('stroke-dasharray', model.circumference + "px");
					
					updateValue(model);
				});
				
				$(model.element).on('load.refresh', function() {
					if (options.coverColor) {
						$(model.element).find('.ctrl-circle-background').css('stroke', options.coverColor);
					}
					
					if (options.accentColor) {
						$(model.element).find('.ctrl-circle-cover').css('stroke', options.accentColor);
						$(model.element).find('.ctrl-circle-background').css('stroke', options.accentColor);
						$(model.element).find('.ctrl-circle-cover').css('fill', options.accentColor);
						$(model.element).find('.ctrl-circle-background').css('fill', options.accentColor);
					}
					
					if (options.accentColor) {
						$(model.element).find('.ctrl-circle-value').css('fill', options.accentColor);
					}
				});
				
				$(model.element).on('keydown', function(evt) {
					if (evt.keyCode == 38) {
						model.value++;
					} else if (evt.keyCode == 40) {
						model.value--;
					} else {
						return;
					}
					
					updateValue(model);
					
					return false;
				});

				$(model.element).on('mousemove', '.ctrl', function(evt) {
					if (model.status.mousedown) {
						if (model.status.prev.pageY > evt.pageY) {
							model.value++;
						} else if(model.status.prev.pageY < evt.pageY) {
							model.value--;
						}
					}
					
					model.status.prev.pageX = evt.pageX;
					model.status.prev.pageY = evt.pageY;
					updateValue(model);
				});
				
				/**
					Mouse wheel event
					Ref : http://stackoverflow.com/questions/8189840/get-mouse-wheel-events-in-jquery
				 */
				
				//Firefox
				$(model.element).on('mousewheel', '.ctrl', function(e){
					if (model.status.mousedown) {
						if (e.originalEvent.wheelDelta < 0) {
							//scroll down
							model.value--;
						} else {
							//scroll up
							model.value++;
						}
					}

					//prevent page fom scrolling
					updateValue(model);
					return false;
				});
				
				//IE, Opera, Safari
				$(model.element).on('DOMMouseScroll', '.ctrl', function(e){
					if (e.originalEvent.wheelDelta < 0) {
						//scroll down
						model.value--;
					} else {
						//scroll up
						model.value++;
					}

					//prevent page fom scrolling
					return false;
				});

				
				$(model.element).on('mousedown', '.ctrl', function(evt) {
					model.status.mousedown = true;
					model.status.prev.pageX = evt.pageX;
					model.status.prev.pageY = evt.pageY;
				});
				
				$(model.element).on('mouseup mouseleave', '.ctrl', function(evt) {
					model.status.mousedown = false;
					$(this).find('.ctrl-circle').css('animation', '');
					$(this).find('.ctrl-circle').css('animation', 'rotate 0.5s');
					$(this).find('.ctrl-circle').css('animation', '');
				});
				
				
				$(model.element).on('focusout blur', function(evt) {
					$(this).find('.ctrl-circle').css('animation', '');
					$(this).find('.ctrl-circle').css('animation', 'rotate 0.5s');
					setTimeout(function() {
						$(this).find('.ctrl-circle').css('animation', '');
						console.log("Done");
					}, 1000);
				});
				
				
				return model.element;
			}
			
			ringCtrl.prototype.getValue = function() {
				return model.value;
			};
			
			ringCtrl.prototype.element = function() {
				return model.element;
			};
		
			ringCtrl.prototype.setValue = function(value) {
				model.value = value;
				updateValue(model);
			};
			
			
			$(document).ready(function() {
				templates.get('ringCtrl.svg').then(function(ringCtrlHtml) {
					draw(ringCtrlHtml);
					parent.html(model.element);
					model.element.load();
				});
			});
		};

		return ringCtrl;
	})();
	

	$.fn.ringCtrl = function(options) {
		var elm = new ringCtrl(this, options).element();
  }
})(
	{ templates: "../dist/templates/" },
	$,
	window
);

