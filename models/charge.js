export default class Charge {
	constructor(date, amount, mandateId, advanceId, finalPayment = false) {
		this.date = date;
		this.amount = amount;
		this.mandateId = mandateId;
		this.advanceId = advanceId;
		this.finalPayment = finalPayment;
	}
}
