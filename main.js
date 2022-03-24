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

export const simulate = () => {
	//const dateArray = getDates(new Date(startDate), new Date(endDate));
	//log.info('dateArray ' + dateArray);
	const dateArray = getDates(new Date('2022-02-05'), new Date('2022-02-06'));

	log.debug('simulate called');
	return dateArray.map((d) => {
		runBilling(d);
	});
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
		log.warn(`map todays advances for customer: ${customers.has(id)}}`);
		chargeList = await processRevenue(id, todaysDate, chargeList);

		log.warn(`charge list: ${chargeList}`);

		const customer = getCustomer(id);

		chargeList = chargeList.concat(customer.getFailedCharges());
		chargeList = chargeList.concat(customer.processAdvances(todaysDate));

		for (const charge of chargeList) {
			await processCharge(customer, charge, todaysDate);
		}
	}
	return customers;
};

export const processNewAdvances = async (todaysAdvances, todaysDate) => {
	log.debug(
		`process new advances for date: ${todaysDate} and advances: ${JSON.stringify(
			todaysAdvances
		)} `
	);

	if (todaysAdvances.length > 0) {
		log.debug('advances found for today');
		// Filter out where repayment_start_date before today
		let advancesToBePaidBackToday = todaysAdvances.filter(
			(a) => new Date(a['repayment_start_date']) <= new Date(todaysDate)
		);

		log.debug(
			`advances to be paid back today ${JSON.stringify(
				advancesToBePaidBackToday
			)}`
		);
		// Map advances
		await advancesToBePaidBackToday.map((ad) => {
			let id = ad['customer_id'];
			const customer = getCustomer(id);
			log.debug(`current advance: ${JSON.stringify(ad)}`);
			customer.addAdvance(ad);
			log.debug(`customer with advance ${JSON.stringify(customer)}`);

			customers.set(id, { ...customers.get(id), customer });
			log.debug(
				`customers with advance ${JSON.stringify([
					...customers.values(),
				])}`
			);

			log.debug(
				`map todays advances for customer: ${customers.has(
					customer.id
				)}}`
			);
		});
	}
};

export const processRevenue = async (id, todaysDate, chargeList) => {
	const customer = getCustomer(id);
	let missingRevenues = customer.getMissingRevenues(todaysDate);
	log.debug(`missing revenues ${missingRevenues}`);

	for (const date of missingRevenues) {
		let revenue = await getRevenue(id, date, todaysDate);
		if (revenue) {
			log.debug(`revenue ${revenue}`);
			customer.addRevenue(date, revenue.amount);
			missingRevenues = missingRevenues.filter((item) => item !== date);
			chargeList = chargeList.concat(customer.processAdvances(date));

			log.warn(`charge list 1: ${chargeList}`);
		} else {
			customer.addMissingRevenue(date);
			log.debug(`missing revenue ${missingRevenues}`);
		}
	}
	return chargeList;
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
