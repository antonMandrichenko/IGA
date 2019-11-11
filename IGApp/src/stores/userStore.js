import { observable, action, decorate } from 'mobx';

class UserStore {
    userAccount = null;
    userMonthPlan = null;

    setUserAccount(data) {
        this.userAccount = data;
    }

    setUserMonthPlan(data, rate=0.5) {
        console.log("setUserPlan", data)
        if(rate !== 1) {
            console.log(rate)
            data.annualBudget = data.annualBudget * rate;
            data.annualBudgetArray = data.annualBudgetArray.map(budget => budget * rate)
        }
        
        this.userMonthPlan = data;
    }
}
decorate(UserStore, {
    userAccount: observable.ref,
    userMonthPlan: observable.ref,
    setUserAccount: action,
    setUserMonthPlan: action
});

export default new UserStore();
