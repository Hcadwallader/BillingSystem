import {
	billingComplete,
	getAdvances,
	getRevenue,
	issueCharge,
} from './services/apiClient.js';
import Customer from './models/customer.js';

let startDate = process.argv[2];
let endDate = process.argv[3];

export const customers = new Map();

export const getDates = (startDate, endDate) => {
	let dateArray = [];
	let currentDate = startDate;
	while (currentDate < endDate) {
		dateArray.push(new Date(currentDate).toISOString().slice(0, 10));
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return dateArray;
};

export const addDays = (date, days) => {
	var result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

export const simulate = () => {
	//let dateArray = getDates(new Date(startDate), new Date(endDate));
	let dateArray = getDates(new Date('2022-01-02'), new Date('2022-01-06'));

	dateArray.map((d) => {
		runBilling(d);
	});
};

export const processNewAdvances = async (todaysAdvances, todaysDate) => {
	if (todaysAdvances.length > 0) {
		// Filter out where repayment_start_date before today
		const advancesToBePaidBackToday = todaysAdvances.filter(
			(a) => new Date(a['repayment_start_date']) <= todaysDate
		);

		// Map advances
		await advancesToBePaidBackToday.map((ad) => {
			const customer = getCustomer(ad['customer_id']);
			customer.addAdvance(ad);
			customers.set(customer.id, customer);
		});
	}
};

export const processRevenue = async (id, todaysDate, chargeList) => {
	const customer = getCustomer(id);
	let missingRevenues = customer.getMissingRevenues(todaysDate);

	for (const date of missingRevenues) {
		let revenue = await getRevenue(id, date, todaysDate);
		if (revenue) {
			customer.addRevenue(date, revenue.amount);
			missingRevenues = missingRevenues.filter((item) => item !== date);
			chargeList = chargeList.concat(customer.processAdvances(date));
		} else {
			customer.addMissingRevenue(date);
		}
	}
	return chargeList;
};

export const getCustomer = (id) => {
	return customers.has(id) ? customers.get(id) : new Customer(id);
};

export const processCharge = async (customer, charge, todaysDate) => {
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

		if (billingResponse) {
			let advance = customer.advance.get(charge.advanceId);
			advance.updateBillingComplete();
		}
	}
};

export const runBilling = async (todaysDate) => {
	// Get advances
	let todaysAdvances = await getAdvances(todaysDate);
	await processNewAdvances(todaysAdvances, todaysDate);

	// Get revenue
	let customerIds = customers.keys();
	let chargeList = [];

	for (const id of customerIds) {
		chargeList = await processRevenue(id, todaysDate, chargeList);

		let customer = getCustomer(id);

		chargeList = chargeList.concat(customer.getFailedCharges());
		chargeList = chargeList.concat(customer.processAdvances(todaysDate));

		for (const charge of chargeList) {
			await processCharge(customer, charge, todaysDate);
		}
	}
	return customers;
};
