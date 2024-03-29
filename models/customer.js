import Advance from './advance.js';

export default class Customer {
	constructor(id) {
		this.id = id;
		this.advances = new Map();
		this.revenue = new Map();
		this.missingRevenue = [];
	}

	getId() {
		return this.id;
	}

	addAdvance(advance) {
		let currentAdvance = new Advance(advance);
		this.advances.set(currentAdvance.id, currentAdvance);
	}

	getAdvance(id) {
		return this.advances.get(id);
	}

	addRevenue(date, amount) {
		this.revenue.set(date, amount);
	}

	getRevenue(date) {
		return this.revenue.get(date);
	}

	processAdvances(date) {
		let chargeList = [];
		this.advances.forEach((a) => {
			const revenue = this.getRevenue(date);
			if (revenue) {
				const charge = a.calculateCharge(revenue, date);
				if (charge) {
					chargeList.push(charge);
				}
			}
		});
		return chargeList;
	}

	addMissingRevenue(date) {
		if (!this.missingRevenue.includes(date)) {
			this.missingRevenue.push(date);
		}
	}

	getMissingRevenues(todaysDate) {
		this.addMissingRevenue(todaysDate);
		return this.missingRevenue;
	}

	getFailedCharges() {
		let failedCharges = [];
		this.advances.forEach((a) => {
			failedCharges = failedCharges.concat(a.getFailedChargesList());
		});
		return failedCharges;
	}

	updateCharge(charge) {
		this.advances.get(charge.advanceId).updateCharge(charge);
	}

	updateMissingRevenue(missingRevenue) {
		this.missingRevenue = missingRevenue;
	}
}
