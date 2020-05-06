export class DatePicker extends BaseWidget {
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widget.datePicker.input);
    thisWidget.initPlugin();
  }



}
