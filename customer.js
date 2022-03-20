import Advance from './advance.js';

export default class Customer {
	constructor(id) {
		this.id = id;
		this.advances = new Map();
		this.revenue = new Map();
	}

	getId() {
		return this.id;
	}

	addAdvance(advance) {
		let currentAdvance = new Advance(advance);
		this.advances.set(currentAdvance.id, currentAdvance);
	}

	addRevenue(date, amount) {
		this.revenue.set(date, amount);
	}

	getRevenue(date) {
		return this.revenue.get(date);
	}

	processTodaysAdvances(date) {
		var chargeList = [];
		this.advances.forEach((a) => {
			let charge = a.calculateCharge(this.getRevenue(date), date);
			if (charge) {
				chargeList.push(charge);
			}
		});
		return chargeList;
	}
}
