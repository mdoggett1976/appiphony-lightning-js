var localeString = 'MM/DD/YYYY';

// Kick off Ember
App = Ember.Application.create({
    rootElement: '#application'
});

Ember.Object.reopen({
    sldsUrl: sldsUrl
});

Ember.Component.reopen({
    attributeBindings: ['data-qa-button', 'data-open-modal', 'data-close-modal', 
                        'data-open-popover', 'data-close-popover', 'data-toggle-popover',
                        'disabled', 'title', 'data-sljs', 'data-placement', 'sf-title']
});

App.ExploreView = Ember.View.extend({
    didInsertElement: function() {
        $('#modal1').on('opened', function() {
            console.log('modal 1 opened');
        });

        $('#modal2').on('closed', function() {
            console.log('modal 2 closed');
        });
    }
});

App.SfFormElementComponent = Ember.Component.extend({
    layoutName: 'components/sf-form-element',
    classNames: 'slds-form-element'
});

App.SfPicklistComponent = Ember.Component.extend({
    init: function() {
        this._super(); 
        
        if (!Ember.Handlebars.helpers['getLabelFromPicklistOption']) {
            Ember.Handlebars.registerBoundHelper('getLabelFromPicklistOption', function(picklistOption, optionValueKey, optionLabelKey, prompt) {            
                if(!Ember.isNone(picklistOption)) {
                    
                    if (optionValueKey) {
                        return new Ember.Handlebars.SafeString(optionLabelKey ? picklistOption[optionLabelKey] : picklistOption[optionValueKey]);
                    } else {
                        return new Ember.Handlebars.SafeString(picklistOption);
                    }
                } else {
                    return prompt || 'Select an Option';
                }
            });
        } 
    },
    attributeBindings: ['content', 'optionValuePath', 'optionLabelPath', 'value', 'selection'],
    layoutName: 'components/sf-picklist',
    classNames: 'slds-form-element',
    contentObjects: function() {
        var value = this.get('value');
        var optionValueKey = this.get('optionValueKey');
        var optionLabelKey = this.get('optionLabelKey');
        return this.get('content').map(function(picklistOption) {
            return {
                value: optionValueKey ? picklistOption[optionValueKey] : picklistOption,
                isSelected: value === (optionValueKey ? picklistOption[optionValueKey] : picklistOption),
                label: optionLabelKey ? picklistOption[optionLabelKey] : picklistOption[optionValueKey] || picklistOption
            };            
        });
    }.property('content', 'value'),
    optionValueKey: function() {
        var optionValuePath = this.get('optionValuePath');

        return optionValuePath ? optionValuePath.replace('content.', '') : null;
    }.property(),
    optionLabelKey: function() {
        var optionLabelPath = this.get('optionLabelPath');

        return optionLabelPath ? optionLabelPath.replace('content.', '') : null;
    }.property(),
    isOpen: false,

    focusIn: function(e) {
        this.setProperties({
            isOpen: true,
            justOpened: true
        });
    },
    focusOut: function(e) {
        if (Ember.isEmpty(this.$().find(e.relatedTarget))) {
            this.setProperties({
                isOpen: false, 
                justOpened: false
            });
        }
    },
    setSelectedPicklistOption: function(picklistOption, optionValueKey) {
        var optionValueKey = this.get('optionValueKey');

        if (optionValueKey) {
            this.setProperties({
                selection: this.get('content').findBy(optionValueKey, picklistOption.value)
            });
        } else {
            this.setProperties({
                selection: picklistOption ? picklistOption : null
            });
        }
    },
    valueChanged: function() {
        var optionValueKey = this.get('optionValueKey');
        var value = this.get('value');
        var selectedPicklistOption = optionValueKey ? this.get('content').findBy(optionValueKey, value) : value;

        this.setSelectedPicklistOption(selectedPicklistOption);
    }.observes('value').on('init'),
    actions: {
        clickTogglePicklist: function() {
            if (this.get('justOpened')) {
                this.set('justOpened', false);
            } else {
                this.$().find(':focus').blur();
            }
        },
        clickPicklistOption: function(picklistOption) {
            this.set('value', picklistOption ? picklistOption.value : null);

            this.$().find(':focus').blur();
        }
    }
});

App.SfModalComponent = Ember.Component.extend(Ember.Evented, {
    init: function() {
        this._super();
        $.fn.modal = function(option){
            $('.slds-fade-in-open').trigger('close');
            this.each(function(){
                if ($(this).hasClass('slds-modal')) {
                    $(this).trigger(option);
                }
                return $(this); // support chaining
            });    
        };
    },
    layoutName: 'components/sf-modal',
    click: function(e) {
        var $target = $(e.target);
        var clickedHeader = !Ember.isEmpty($target.closest('.slds-modal__header'));
        var clickedBody = !Ember.isEmpty($target.closest('.slds-modal__content'));
        var clickedFooter = !Ember.isEmpty($target.closest('.slds-modal__footer'));
        
        if ((!clickedHeader && !clickedBody && !clickedFooter && !this.get('preventBgClose'))
                || !Ember.isEmpty($target.closest('[data-close-modal="' + this.get('modalId') + '"]'))) {
            this.closeModal();
        } 
    },
    willInsertElement: function(e) {
        this.$().removeClass(this.get('class'));
        this.$().find('.slds-modal').addClass(this.get('class'));

        var headerContents = this.$().find('modalHeader').contents();
        var bodyContents = this.$().find('modalBody').contents();
        var footerContents = this.$().find('modalFooter').contents();

        if (Ember.isEmpty(headerContents)) {
            this.$().find('.slds-modal__header').remove();
        } else {
            this.$().find('headerYield').replaceWith(headerContents);
            this.$().find('modalHeader').remove();
        }

        if (Ember.isEmpty(bodyContents)) {
            this.$().find('.slds-modal__content').remove();
        } else {
            this.$().find('bodyYield').replaceWith(bodyContents);
            this.$().find('modalBody').remove();
        }

        if (Ember.isEmpty(footerContents)) {
            this.$().find('.slds-modal__footer').remove();
        } else {
            this.$().find('footerYield').replaceWith(footerContents);
            this.$().find('modalFooter').remove();
        }
    },
    didInsertElement: function() {
        Ember.run.scheduleOnce('afterRender', this, function() {
            var self = this;
            
            $('body').on('click', '[data-open-modal="' + this.get('modalId') + '"]', function() {
                self.openModal();
            });
        });
    },
    openModal: function() {
        var self = this;
        this.set('isModalOpen', true);

        if (this.get('openFunction')) {
            var params = ['openFunction'];
            var paramNum = 1;

            while(!Ember.isEmpty(this.get('param' + paramNum))) {
                params.push(this.get('param' + paramNum));
                paramNum++;
            } 

            this.sendAction.apply(this, params);
        }

        $('#' + this.get('modalId')).trigger('opened');

        $('body').on('keyup', function(e) {
            if (e.keyCode === 27) {
                $(this).unbind('keyup');
                self.closeModal();
            }
        });
    },
    closeModal: function() {
        this.set('isModalOpen', false);

        $('#' + this.get('modalId')).trigger('closed');
    }
});

App.SfButtonComponent = Ember.Component.extend({
    layoutName: 'components/sf-button',
    tagName: 'button',
    classNames: 'slds-button',
    classNameBindings: 'selectedState',
    selectedState: function() {
        var selectedWhen = this.get('selectedWhen');

        if (!Ember.isEmpty(selectedWhen)) {
            return selectedWhen ? 'slds-is-selected' : 'slds-not-selected';
        } else {
            return null;
        }
    }.property('selectedWhen'),
    disabled: function() {
        return this.get('disabledWhen') ? 'disabled' : false;
    }.property('disabledWhen'),
    'data-qa-button' : function() {
        var locatorName = this.get('locator') || this.get('action');

        if (Ember.isEmpty(locatorName)) {
            if (!Ember.isEmpty(this.get('data-close-modal'))) {
                locatorName = 'close modal ' + this.get('data-close-modal');
            } else if (!Ember.isEmpty(this.get('data-open-modal'))) {
                locatorName = 'open modal ' + this.get('data-open-modal');
            } else {
                locatorName = 'button'
            }
        }

        return locatorName.camelize();
    }.property(),
    hasIcons: function() {
        return !Ember.isEmpty(this.get('iconLeft')) || !Ember.isEmpty(this.get('iconRight'));
    }.property('iconLeft', 'iconRight'),
    iconUrl: function() {
        var iconLeft = this.get('iconLeft');
        var iconRight = this.get('iconRight');

        if (iconLeft) {
            return this.get('sldsUrl') + '/assets/icons/utility-sprite/svg/symbols.svg#' + iconLeft;
        } else if (iconRight) {
            return this.get('sldsUrl') + '/assets/icons/utility-sprite/svg/symbols.svg#' + iconRight;
        } else {
            return null;
        }
    }.property('iconLeft', 'iconRight'),
    click: function() {
        var paramNum = 1;
        var params = ['action'];

        while(!Ember.isEmpty(this.get('param' + paramNum))) {
            params.push(this.get('param' + paramNum));
            paramNum++;
        } 

        this.sendAction.apply(this, params);
    }
});

App.SfDatepickerComponent = Ember.Component.extend({
    attributeBindings: ['selectedDate'],
    init: function() {
        var self = this;

        this._super();
        this.initCalendar();

        if (!Ember.Handlebars.helpers['convertNumberToMonth']) {
            Ember.Handlebars.registerBoundHelper('convertNumberToMonth', function(index) {            
                if(!Ember.isNone(index)) {
                    return new Ember.Handlebars.SafeString(self.get('monthLabels')[index].full);
                } else {
                    return '';
                }
            });
        }

        if (!Ember.Handlebars.helpers['convertNumberToDayOfWeek']) {
            Ember.Handlebars.registerBoundHelper('convertNumberToDayOfWeek', function(index) {
                if(!Ember.isNone(index)) {
                    return new Ember.Handlebars.SafeString(self.get('dayLabels')[index]);
                } else {
                    return '';
                }
            });
        }
    },
    initCalendar: function() {
        if (!this.get('isOpen')) {
            var initDate = this.get('selectedDate') || moment();

            this.set('selectedYear', initDate.toDate().getFullYear());
            this.set('selectedMonth', initDate.toDate().getMonth());

            if (!Ember.isNone(this.get('selectedDate'))) {
                this.set('selectedDateText', this.get('selectedDate').format(localeString));
            }
        }
    },
    numYearsBefore: 50,
    numYearsAfter: 10,
    layoutName: 'components/sf-datepicker',
    didInsertElement: function() {
        var self = this;

        $('body').on('click', function() {
           self.closeDatepicker();
        });

        $('body').on('keyup', this, this.triggerClickNextOrPrev);
    },
    willClearRender: function() {
        $('body').unbind('keyup', this, this.triggerClickNextOrPrev);
    },
    years: function() {
        var currentYear = (new Date()).getFullYear();
        var years = [];
        for (var i = currentYear - this.get('numYearsBefore'); i <= currentYear + this.get('numYearsAfter'); i++) {
            years.push(Ember.Object.create({
                value: i,
                isSelected: i === currentYear
            }));
        }

        return  years;
    }.property(),
    dayLabels: [
        {
            full: 'Sunday',
            abbv: 'S'
        },
        {
            full: 'Monday',
            abbv: 'M'
        },
        {
            full: 'Tuesday',
            abbv: 'T'
        },
        {
            full: 'Wednesday',
            abbv: 'W'
        },
        {
            full: 'Thursday',
            abbv: 'T'
        },
        {
            full: 'Friday',
            abbv: 'F'
        },
        {
            full: 'Saturday',
            abbv: 'S'
        }
    ],
    monthLabels: [
        {
            full: 'January',
            abbv: ''
        },
        {
            full: 'February',
            abbv: ''
        },
        {
            full: 'March',
            abbv: ''
        },
        {
            full: 'April',
            abbv: ''
        },
        {
            full: 'May',
            abbv: ''
        },
        {
            full: 'June',
            abbv: ''
        },
        {
            full: 'July',
            abbv: ''
        },
        {
            full: 'August',
            abbv: ''
        },
        {
            full: 'September',
            abbv: ''
        },
        {
            full: 'October',
            abbv: ''
        },
        {
            full: 'November',
            abbv: ''
        },
        {
            full: 'December',
            abbv: ''
        }
    ],
    isLeapYear: function () {
        var year = this.get('selectedYear');
        return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
    }.property('selectedYear'),
    getNumDaysInMonth: function(month) {
        return [31, (this.get('isLeapYear') ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },
    numDaysInMonth: function () {
        return this.getNumDaysInMonth(this.get('selectedMonth'));
    }.property('selectedMonth'),
    calendarRows: function() {
        var selectedDate = this.get('selectedDate');
        var selectedMonth = this.get('selectedMonth');
        var selectedYear = this.get('selectedYear');
        var numDaysInMonth = this.getNumDaysInMonth(this.get('selectedMonth'));
        var numDaysInPrevMonth = this.getNumDaysInMonth(selectedMonth === 0 ? 11 : selectedMonth - 1);
        var numDaysInNextMonth = this.getNumDaysInMonth(selectedMonth === 11 ? 0 : selectedMonth + 1);
        var firstDayOfMonth = (new Date(this.get('selectedYear'), this.get('selectedMonth'), 1)).getDay();
        var allDays = [];
        var calendarRows = [];
        var dayLabels = this.get('dayLabels');

        // Fill previous month
        for (var i = numDaysInPrevMonth - (firstDayOfMonth - 1); i <= numDaysInPrevMonth; i++) {
            var iDate = moment(new Date(selectedYear, selectedMonth, i));
            allDays.push({
                value: i,
                isCurrentMonth: false,
                isSelected: !Ember.isNone(selectedDate) && iDate.isSame(selectedDate, 'day'),
                isToday: iDate.isSame(moment(), 'day')
            });
        }

        // Fill current month
        for (var i = 1; i <= numDaysInMonth; i++) {
            var iDate = moment(new Date(selectedYear, selectedMonth, i));
            allDays.push({
                value: i,
                isCurrentMonth: true,
                isSelected: !Ember.isNone(selectedDate) && iDate.isSame(selectedDate, 'day'),
                isToday: iDate.isSame(moment(), 'day')
            });
        }

        // Split array into rows of 7
        allDays.forEach(function(day, index) {
            if (index % 7 === 0) {
                calendarRows.push([]);
            }

            calendarRows[calendarRows.length - 1].push(day);
        });
        
        // Fill last row
        if (calendarRows[calendarRows.length - 1].length < 7) {
            var iDate = moment(new Date(selectedYear, selectedMonth, i));
            var numColsToFill = 7 - calendarRows[calendarRows.length - 1].length;
            for (var i = 1; i <= numColsToFill; i++) {
                calendarRows[calendarRows.length - 1].push({
                    value: i,
                    isCurrentMonth: false,
                    isSelected: !Ember.isNone(selectedDate) && iDate.isSame(selectedDate, 'day'),
                    isToday: iDate.isSame(moment(), 'day')
                });
            }
        }

        return calendarRows;
    }.property('selectedMonth', 'selectedYear', 'selectedDate'),
    focusIn: function() {
        this.openDatepicker();
    },
    click: function(e) {
        e.stopPropagation();
        var $target = $(e.target);
        if (!Ember.isEmpty($target.closest('.slds-datepicker')) && Ember.isEmpty($target.closest('.datepicker__filter--year'))) {
            this.closeYearDropdown();
        }
    },
    keyPress: function(e) {
        if (e.keyCode === 13) {
            this.setDateFromInput();
        }
    },
    triggerClickNextOrPrev: function(e) {
        var self = e.data;
        if(self.get('isOpen') === true && Ember.isEmpty(self.$().find('input:focus'))) {
            if (e.keyCode === 37) {
                self.send('clickNextOrPrevMonth', 'prev');
            } else if (e.keyCode === 39) {
                self.send('clickNextOrPrevMonth', 'next');
            }
        }
    },
    openDatepicker: function() {
        this.initCalendar();
        this.set('isOpen', true);
    },
    closeDatepicker: function() {
        this.setProperties({
            isYearOpen: false,
            isOpen: false
        });
        this.$().find('input').blur();
    },
    openYearDropdown: function() {
        this.set('isYearOpen', true);
    },
    closeYearDropdown: function() {
        if (this.get('isYearOpen') === true) {
            this.set('isYearOpen', false);
        }
    },
    yearDropdownOpened: function() {
        if (this.get('isYearOpen')) {
            Ember.run.scheduleOnce('afterRender', this, function() {
                this.$().find('#yearDropdown').scrollTop(this.$().find('#yearDropdown' + this.get('selectedYear')).position().top);
            });
        }
    }.observes('isYearOpen'),
    selectedYearChanged: function() {
        console.log(this.get('selectedYear'));
        this.get('years').findBy('isSelected', true).set('isSelected', false);
        this.get('years').findBy('value', this.get('selectedYear')).set('isSelected', true);
    }.observes('selectedYear'),
    setDateFromInput: function(){
        var selectedDateText = this.get('selectedDateText');
        var momentDate = moment(new Date(selectedDateText));
        var currentYear = (new Date()).getFullYear();
        var earliestCalendarYear = new Date(currentYear - this.get('numYearsBefore'), 0, 1);
        var latestCalendarYear = new Date(currentYear + this.get('numYearsAfter'), 11, 31);

        if (momentDate && momentDate.isValid() && momentDate.isAfter(earliestCalendarYear) && momentDate.isBefore(latestCalendarYear)) {
            this.set('selectedDate', momentDate);
            this.closeDatepicker();
        }
    },
    actions: {
        clickSelectYear: function(year) {
            this.set('selectedYear', year);
            this.closeYearDropdown();
        },
        clickYearDropdown: function() {
            this.toggleProperty('isYearOpen');
        },
        clickNextOrPrevMonth: function(direction) {
            var selectedMonth = this.get('selectedMonth');

            if (direction === 'next') {
                if (selectedMonth === 11) {
                    this.set('selectedMonth', 0);
                    this.incrementProperty('selectedYear');
                } else {
                    this.incrementProperty('selectedMonth');
                }
            } else if (direction === 'prev') {
                if (selectedMonth === 0) {
                    this.set('selectedMonth', 11);
                    this.decrementProperty('selectedYear');
                } else {
                    this.decrementProperty('selectedMonth');
                }
            }
        },
        clickSelectDate: function(dayObj) {
            var selectedMonth = this.get('selectedMonth');
            var selectedYear = this.get('selectedYear');
            var selectedDay = dayObj.value;

            if (dayObj.isCurrentMonth === true) {
                this.set('selectedDate', moment(new Date(selectedYear, selectedMonth, selectedDay)));
                this.set('selectedDateText', moment(new Date(selectedYear, selectedMonth, selectedDay)).format(localeString));
                this.closeDatepicker();
            }
        }
    }
});

App.SfPopoverComponent = Ember.Component.extend({
    layoutName: 'components/sf-popover',
    classNames: 'slds-popover',
    classNameBindings: ['positionClass', 'slds-hide'],
    attributeBindings: ['role', 'style'],
    role: 'dialog',
    nubbinHeight: 15,
    nubbinWidth: 15,
    'slds-hide': function() {
        return !this.get('isOpen');
    }.property('isOpen'),
    willInsertElement: function(e) {
        var headerContents = this.$().find('popoverHeader').contents();
        var bodyContents = this.$().find('popoverBody').contents();

        if (Ember.isEmpty(headerContents)) {
            this.$().find('.slds-popover__header').remove();
        } else {
            this.$().find('headerYield').replaceWith(headerContents);
        }

        if (Ember.isEmpty(bodyContents)) {
            this.$().find('.slds-popover__body').remove();
        } else {
            this.$().find('bodyYield').replaceWith(bodyContents);
        }
    },
    didInsertElement: function() {
        Ember.run.scheduleOnce('afterRender', this, function() {
            var self = this;
            
            $('body').on('click', '[data-open-popover="' + this.get('popoverId') + '"]', function() {
                self.openPopover();
            });

            $('body').on('click', '[data-close-popover="' + this.get('popoverId') + '"]', function() {
                self.closePopover();
            });

            $('body').on('click', '[data-toggle-popover="' + this.get('popoverId') + '"]', function() {
                self.togglePopover();
            });

            this.$().appendTo('[data-toggle-popover="' + this.get('popoverId') + '"]');
        });
    },
    positionClass: function() {
        var nubbinPositionObject = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right'
        };

        return 'slds-nubbin--' + nubbinPositionObject[this.get('position')];
    }.property('position'),
    openPopover: function() {
        this.set('isOpen', true);
        this.positionPopover();
    },
    closePopover: function() {
        this.set('isOpen', false);
    },
    togglePopover: function() {
        this.toggleProperty('isOpen');

        if (this.get('isOpen')) {
            this.positionPopover();
        }
    },
    positionPopover: function() {
        Ember.run.scheduleOnce('afterRender', this, function() {
            var nubbinHeight = this.get('nubbinHeight');
            var nubbinWidth = this.get('nubbinWidth');
            var popoverPosition = this.get('position');
            var target = $('[data-toggle-popover="' + this.get('popoverId') + '"]')[0];
            var popoverNode = this.$()[0];
            
            popoverNode.style['width'] = popoverNode.offsetWidth + 'px';
            popoverNode.style['position'] = 'absolute';

            if (popoverPosition === 'top' || popoverPosition === 'bottom') {
                popoverNode.style['left'] = (target.offsetWidth / 2) - (popoverNode.offsetWidth / 2) + 'px'; 
                popoverNode.style[popoverPosition] = '-' + (popoverNode.offsetHeight + nubbinHeight) + 'px';
            } else if (popoverPosition === 'left' || popoverPosition === 'right') {
                popoverNode.style['top'] = (target.offsetHeight / 2) - (popoverNode.offsetHeight / 2) + 'px'; 
                popoverNode.style[popoverPosition] = '-' + (popoverNode.offsetWidth + nubbinWidth) + 'px';
            }   
        });     
    }
});

App.ExploreController = Ember.ObjectController.extend({
    selectedDate: function() {
        return moment().add(5, 'days');
    }.property(),
    selectedPicklistThing: 1,
    picklistThings: [
        {
            value: 1,
            label: 'One'
        },
        {
            value: 2,
            label: 'Two'
        }
    ],
    picklistSimplerThings: ['Four', 'Five'],
    things: [
        Ember.Object.create({
            id: '1',
            name: 'one',
            iconUrl: sldsUrl + '/assets/icons/utility-sprite/svg/symbols.svg#download',
            isSelected: true
        }),
        Ember.Object.create({
            id: '2',
            name: 'two',
            iconUrl: sldsUrl + '/assets/icons/utility-sprite/svg/symbols.svg#apps',
            isSelected: false
        })
    ],
    actions: {
        doThis: function(id, name, thing) {
            console.log('this');
            console.log(id);
            console.log(name);
            //var thing = this.get('things').findBy('id', id);

            thing.toggleProperty('isSelected');
            this.get('things').rejectBy('id', id)[0].toggleProperty('isDisabled');
        },
        doThat: function(id, name, thing) {
            console.log('that');
            thing.toggleProperty('isSelected');
            this.get('things').rejectBy('id', id)[0].toggleProperty('isDisabled');
        },
        sayHi: function(param1, param2) {
            console.log('hi, this function was called by the component');
            console.log(param1);
            console.log(param2);
        },
        sayBye: function() {
            console.log('NOT!');
        }
    }
});

App.ExploreRoute = Ember.Route.extend({
    model: function (){
        return {};
    }
});

// Router
App.Router.map(function() {
    this.resource('explore', { path: '/' });
});


// // This setting disables the detail routing from showing up in the navbar.
App.Router.reopen( {
    location: 'none'
});
