import {
	billingComplete,
	getAdvances,
	getRevenue,
	issueCharge,
} from './services/apiClient.js';
import Customer from './models/customer.js';
import log from 'loglevel';
log.setLevel('debug');

let startDate = process.argv[2];
let endDate = process.argv[3];

export const customers = new Map();

export const simulate = async() => {
	log.debug('simulate called');
	const dateArray = getDates(new Date(startDate), new Date(endDate));

	for (const date of dateArray){
		await runBilling(date);
	}
};

export const runBilling = async (todaysDate) => {
	log.debug('run billing called for ' + todaysDate);
	// Get advances
	let todaysAdvances = await getAdvances(todaysDate);
	await processNewAdvances(todaysAdvances, todaysDate);

	// Get revenue
	let customerIds = customers.keys();
	let chargeList = [];

	for (const id of customerIds) {
		chargeList = await processRevenue(id, todaysDate, chargeList);

		const customer = getCustomer(id);

		chargeList = chargeList.concat(customer.getFailedCharges());
		chargeList = chargeList.concat(customer.processAdvances(todaysDate));

		for (const charge of chargeList) {
			await processCharge(customer, charge, todaysDate);
		}
	}
	log.debug(
		`customers ${customers} after billing run for date ${todaysDate}`
	);
	return customers;
};

export const processNewAdvances = async (todaysAdvances, todaysDate) => {
	if (todaysAdvances.length > 0) {
		let advancesToBePaidBackToday = todaysAdvances.filter(
			(a) => new Date(a['repayment_start_date']) <= new Date(todaysDate)
		);

		await advancesToBePaidBackToday.map((ad) => {
			let id = ad['customer_id'];
			const customer = getCustomer(id);
			customer.addAdvance(ad);
			customers.set(id, customer);
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

export const processCharge = async (customer, charge, todaysDate) => {
	const chargeResponse = await issueCharge(
		charge.mandateId,
		charge.amount,
		charge.date
	);
	if (chargeResponse) {
		charge.markAsSuccessful();
	} else {
		const currentAdvance = customer.getAdvance(charge.advanceId);
		currentAdvance.addFailedChargeToList(charge, todaysDate);
	}
	if (charge.finalPayment) {
		const billingResponse = await billingComplete(charge.advanceId);

		if (billingResponse) {
			const advance = customer.advance.get(charge.advanceId);
			advance.updateBillingComplete();
		}
	}
};

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
	let newDate = new Date(date);
	newDate.setDate(newDate.getDate() + days);
	return newDate;
};
export const getCustomer = (id) => {
	return customers.has(id) ? customers.get(id) : new Customer(id);
};
