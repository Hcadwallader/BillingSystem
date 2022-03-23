import Charge from './charge.js';

export default class Advance {
	constructor(advance) {
		this.id = advance['id'];
		this.mandateId = advance['mandate_id'];
		this.totalOwed =
			parseInt(advance['total_advanced']) + parseInt(advance['fee']);
		this.repaymentStartDate = new Date(advance['repayment_start_date']);
		this.repaymentPercentage = advance['repayment_percentage'];
		this.totalRemaining =
			parseInt(advance['total_advanced']) + parseInt(advance['fee']);
		this.billingComplete = false;
		this.charges = new Map();
		this.leftoverChargeAmount = 0;
		this.failedCharges = new Map();
	}

	calculateCharge(revenue, date) {
		if (
			this.billingComplete ||
			this.repaymentStartDate > date ||
			this.charges.has(date)
		)
			return null;
		let amount =
			revenue * (this.repaymentPercentage / 100) +
			this.leftoverChargeAmount;
		this.leftoverChargeAmount = 0;
		if (this.totalRemaining - amount < 0) {
			amount = this.totalRemaining;
		}

		const chargeLimit = 10000;
		if (amount > chargeLimit) {
			this.leftoverChargeAmount = amount - chargeLimit;
			amount = chargeLimit;
		}
		let currentCharge = new Charge(date, amount, this.mandateId, this.id);
		this.charges.set(date, currentCharge);
		this.totalRemaining -= amount;
		if (this.totalRemaining <= 0) {
			this.billingComplete = true;
			currentCharge.finalPayment = true;
		}
		return currentCharge;
	}

	updateBillingComplete() {
		this.billingComplete = true;
	}

	addFailedChargeToList(charge, date) {
		if (!this.charges.has(date)) {
			this.failedCharges.set(date, charge);
		}
	}

	getFailedChargesList(){
		return this.failedCharges;
	}
}
