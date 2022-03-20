import {
	billingComplete,
	getAdvances,
	getRevenue,
	issueCharge,
} from './apiClient.js';
import Customer from './customer.js';
import { getDates } from './utilities.js';

let startDate = process.argv[2];
let endDate = process.argv[3];

const customers = new Map();

const simulate = () => {
	let dateArray = getDates(new Date(startDate), new Date(endDate));
	//let dateArray = getDates(new Date('2022-01-02'), new Date('2022-01-06'));

	dateArray.map((d) => {
		runBilling(d);
	});
};

const getCustomer = (id) => {
	return customers.has(id) ? customers.get(id) : new Customer(id);
};

const runBilling = async (date) => {
	// Get advances
	let todaysAdvances = await getAdvances(date);

	// Filter out where repayment_start_date < today
	let advancesToBePaidBackToday = todaysAdvances.filter(
		(a) => a['repayment_start_date'] <= date
	);

	// Map advances
	await advancesToBePaidBackToday.map((ad) => {
		var customer = getCustomer(ad['customer_id']);
		customer.addAdvance(ad);
		customers.set(customer.id, customer);
	});

	// Get revenue
	let customerIds = customers.keys();
	for (const c of customerIds) {
		let revenue = await getRevenue(c, date);
		let customer = getCustomer(c);
		customer.addRevenue(date, revenue.amount);
	}

    // calculate charges and charge customers
	for (const c of customerIds) {
		let customer = getCustomer(c);
		let chargeList = customer.processTodaysAdvances(date);
		for (const charge of chargeList) {
			await issueCharge(charge.mandateId, charge.amount, date);
			if (charge.finalPayment) {
				await billingComplete(charge.advanceId);
			}
		}
	}
};

simulate();
