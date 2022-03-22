export default class Charge {
	constructor(
		date,
		amount,
		mandateId,
		advanceId,
		finalPayment = false,
		succeeded = false
	) {
		this.date = date;
		this.amount = amount;
		this.mandateId = mandateId;
		this.advanceId = advanceId;
		this.finalPayment = finalPayment;
		this.succeeded = succeeded;
	}

	markAsSuccessful() {
		this.succeeded = true;
	}
}
