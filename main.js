import {
	billingComplete,
	getAdvances,
	getRevenue,
	issueCharge,
} from './services/apiClient.js';
import Customer from './models/customer.js';

let startDate = process.argv[2];
let endDate = process.argv[3];

const customers = new Map();

const getDates = (startDate, endDate) => {
	let dateArray = [];
	let currentDate = startDate;
	while (currentDate <= endDate) {
		dateArray.push(new Date(currentDate).toISOString().slice(0, 10));
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return dateArray;
};

const simulate = () => {
	//let dateArray = getDates(new Date(startDate), new Date(endDate));
	let dateArray = getDates(new Date('2022-01-02'), new Date('2022-01-06'));

	dateArray.map((d) => {
		runBilling(d);
	});
	return customers;
};

const getCustomer = (id) => {
	return customers.has(id) ? customers.get(id) : new Customer(id);
};

const runBilling = async (todaysDate) => {
	// TODO - get charges that failed from previous days (use customers object above)

	// Get advances
	let todaysAdvances = await getAdvances(todaysDate);

	if (todaysAdvances.length > 0) {
		// Filter out where repayment_start_date before today
		let advancesToBePaidBackToday = todaysAdvances.filter(
			(a) => a['repayment_start_date'] <= todaysDate
		);

		// Map advances
		await advancesToBePaidBackToday.map((ad) => {
			var customer = getCustomer(ad['customer_id']);
			customer.addAdvance(ad);
			customers.set(customer.id, customer);
		});
	}

	// Get revenue
	let customerIds = customers.keys();
	let chargeList = [];

	for (const id of customerIds) {
		let customer = getCustomer(id);
		let missingRevenues = customer.getMissingRevenues(todaysDate);

		for (const date of missingRevenues) {
			let revenue = await getRevenue(id, date);
			if (revenue) {
				customer.addRevenue(date, revenue.amount);
				missingRevenues = missingRevenues.filter(
					(item) => item !== date
				);
				chargeList.concat(customer.processAdvances(date));
			} else {
				customer.addMissingRevenue(date);
			}
		}
	}

	// calculate charges and charge customers
	for (const c of customerIds) {
		let customer = getCustomer(c);
		let advances = customer.advances;

		for (const ad of advances) {
			chargeList.push(ad.failedCharges);
		}
		chargeList.concat(customer.processAdvances(todaysDate));
		for (const charge of chargeList) {
			let chargeResponse = await issueCharge(
				charge.mandateId,
				charge.amount,
				charge.date
			);
			if (chargeResponse) {
				charge.markAsSuccessful();
			} else {
				let currentAdvance = customer.getAdvance(charge.advanceId);
				currentAdvance.addFailedChargeToList(charge, todaysDate);
			}
			if (charge.finalPayment) {
				let billingResponse = await billingComplete(charge.advanceId);
				// Todo - update billingComplete property on advance
				if (billingResponse) {
					let advance = customer.advance.get(charge.advanceId);
					advance.updateBillingComplete();
				}
			}
		}
	}
	return customers;
};

simulate();
