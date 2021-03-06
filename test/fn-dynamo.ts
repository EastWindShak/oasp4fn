
import { expect } from 'chai';
import fn from '../src/index';
import dynamo from '../src/adapters/fn-dynamo';
let DynamoDB = require('aws-sdk/clients/dynamodb');

let endpoint = process.env.ENDPOINT || 'http://localhost:8000/';
let region = process.env.REGION || 'us-west-2';
let dynamodb = new DynamoDB({ endpoint: endpoint, region: region });
let docClient = new DynamoDB.DocumentClient({ endpoint: endpoint, region: region });

fn.setDB(dynamo, { endpoint: endpoint, region: region });

interface Employee {
    id: string;
    firstname: string;
    surname: string;
    department: string;
}
let employees = [
    {id: '1', firstname: 'Paquito', surname: 'Chocolatero', department: '1'},
    {id: '2', firstname: 'Paquita', surname: 'Chocolatera', department: '3'},
    {id: '3', firstname: 'Paco', surname: 'Chocolatero', department: '1'},
    {id: '4', firstname: 'Fran', surname: 'Chocolatero', department: '2'}
];

interface Department {
    id: string;
    dept_name: string;
    floor: number[];
}
let departments = [
    {id: '1', dept_name: 'Logistic', floor: [1, 2]},
    {id: '2', dept_name: 'RRHH', floor: [3]},
    {id: '3', dept_name: 'Architecture', floor: [2, 3]},
    {id: '4', dept_name: 'UX', floor: [4, 5, 6]}
];

before(async () => {
    let creates: Promise<void>[] = [];
    let inserts: Promise<void>[] = [];

    let params = {
        TableName : 'employees',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH'}
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    };
    try {
        await dynamodb.deleteTable({TableName: 'employees'}).promise();
    }catch (err) {
        if (err.code !== 'ResourceNotFoundException')
            return Promise.reject(err);
    }
    creates.push(dynamodb.createTable(params).promise());

    params = {
        TableName : 'departments',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH'}
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        }
    };
    try {
        await dynamodb.deleteTable({TableName: 'departments'}).promise();
    }catch (err) {
        if (err.code !== 'ResourceNotFoundException')
            return Promise.reject(err);
    }
    creates.push(dynamodb.createTable(params).promise());

    try {
        await Promise.all(creates);
        departments.forEach((department) => {
            let params = {
                TableName: 'departments',
                Item: department
            };
            inserts.push(docClient.put(params).promise());
        });
        employees.forEach((employee) => {
            let params = {
                TableName: 'employees',
                Item: employee
            };
            inserts.push(docClient.put(params).promise());
        });
    }catch (err) {
        return Promise.reject(err);
    }

    try {
        await Promise.all(inserts);
    } catch (err) {
        return Promise.reject(err);
    }
});

describe('table', () => {

     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees')).to.be.an('object');
     });
     it('If the table exist, the resolution promise should return an Array<Object>', (done: Function) => {
        fn.table('employees').then((res: Employee[]) => {
            try {
                expect(res).to.be.an('array');
                expect(res).to.have.lengthOf(4);
                done();
            }
            catch (err) {
                done(err);
            }
         }, (err: Error) => {
             try {
                expect(err).to.be.undefined;
                done();
             }
             catch (err) {
                done(err);
             }
         });
     });
     it('If the table doesn\'t exist, the resolution promise should return an Error', (done: Function) => {
         fn.table('some_table').then((res: object[]) => {
            try {
                expect(res).to.be.undefined;
                done();
             }
             catch (err) {
                 done(err);
             }
            }, (err: Error) => {
             try {
                expect(err).to.not.be.null;
                done();
             }
             catch (err) {
                 done(err);
             }
         });
     });
     it('If an id is passed along with the name of the table, the corresponding item will be returned', (done: Function) => {
         fn.table('departments', '1')
             .then((res: Department) => {
                 try {
                 expect(res).to.be.an('object');
                 expect(res).to.have.property('id', '1');
                 done();
                }
                catch (err) {
                    done(err);
                }
             }, (err: Error) => {
                 try {
                     expect(err).to.be.undefined;
                     done();
                 }
                 catch (err) {
                     done(err);
                 }
             });
     });
     it('If an array of id\'s is passed along with the name of the table, the corresponding list of items will be returned', (done: Function) => {
             fn.table('departments', ['1', '3', '4'])
                 .then((res: Department[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(3);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                 }, (err: Error) => {
                     try {
                         expect(err).to.be.undefined;
                         done();
                     }
                     catch (err) {
                         done(err);
                     }
                 });
     });
     it('If an id passed doesn\'t have an item in the table, an error will be returned', (done: Function) => {
         fn.table('departments', '7')
             .then((res: Department) => {
                 try {
                    expect(res).to.be.undefined;
                    done();
                   }
                 catch (err) {
                        done(err);
                   }
             }, (err: Error) => {
                 try {
                     expect(err).to.be.a('string');
                     done();
                 }
                 catch (err) {
                     done(err);
                 }
             });
     });
});

describe('where', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').where('id')).to.be.an('object');
     });
     it('If the operation is succesful, the resolution should be an Array<Object>', (done: Function) => {
         fn.table('employees')
             .where('id', '1')
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(1);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('If the operation fail, the resolution should be an error', (done: Function) => {
         fn.table('employees')
             .where('id', '1', '23')
             .then((res: Employee[]) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.a('string');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('orderBy', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').orderBy('id')).to.be.an('object');
     });
     it("If you don't specify an order, the result array is sorted ascendingly", (done: Function) => {
         fn.table('employees')
             .orderBy('id')
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        let i = res.length;
                        while (--i) {
                            expect(res[i].id >= res[i - 1].id).to.be.true;
                        }
                        done();

                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If you specify 'desc' as the order, the result array is sorted descendingly", (done: Function) => {
         fn.table('employees')
             .orderBy('id', 'desc')
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        let i = res.length;
                        while (--i) {
                            expect(res[i].id <= res[i - 1].id).to.be.true;
                        }
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If you pass more than one attribute, the result array should be sorted having in mind all the atributtes", (done: Function) => {
         fn.table('employees')
             .orderBy(['department', 'id'], 'desc')
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        let i = res.length;
                        while (--i) {
                            expect(res[i].department <= res[i - 1].department).to.be.true;
                            if(res[i].department === res[i - 1].department)
                                expect(res[i].id <= res[i - 1].id).to.be.true;
                        }
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                    }
                    catch (err) {
                        done(err);
                    }
             });
        fn.table('employees')
             .orderBy(['department', 'id'], ['desc', 'asc'])
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        let i = res.length;
                        while (--i) {
                            expect(res[i].department <= res[i - 1].department).to.be.true;
                            if(res[i].department === res[i - 1].department)
                                expect(res[i].id >= res[i - 1].id).to.be.true;
                        }
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If you pass more orders than attributes, the first orders corresponding to the attributtes length should be used", (done: Function) => {
         fn.table('employees')
             .orderBy(['department', 'id'], ['desc', 'asc', 'des'])
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        let i = res.length;
                        while (--i) {
                            expect(res[i].department <= res[i - 1].department).to.be.true;
                            if(res[i].department === res[i - 1].department)
                                expect(res[i].id >= res[i - 1].id).to.be.true;
                        }
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If you pass less orders than attributes, the unspecified orders should be 'asc'", (done: Function) => {
         fn.table('employees')
             .orderBy(['department', 'id'], ['desc'])
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        let i = res.length;
                        while (--i) {
                            expect(res[i].department <= res[i - 1].department).to.be.true;
                            if(res[i].department === res[i - 1].department)
                                expect(res[i].id >= res[i - 1].id).to.be.true;
                        }
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If the especified attribute doesn't exist, the function return the same array", (done: Function) => {
         fn.table('employees')
             .orderBy('error')
             .then((res: Employee[]) => {
                    try {
                       expect(res).to.be.an('array');
                       expect(res).to.have.lengthOf(4);
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('first', () => {
    let first_object: Employee;
     before(() => {
        return fn.table('employees')
             .then((res: Employee[]) => {
                 first_object = res[0];
             });
     });
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').first()).to.be.an('object');
     });
     it('If the operation is succesful, the result is the first object of the table', (done: Function) => {
         fn.table('employees')
             .first()
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(1);
                        expect(res[0]).to.deep.equal(first_object);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If the operation isn't done over an array, the operation should return an error", (done: Function) => {
         fn.table('employees')
             .count()
             .first()
             .then((res: Employee[]) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.a('string');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('count', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').count()).to.be.an('object');
     });
     it('If the operation is succesful, the result is the number of items of the table', (done: Function) => {
         fn.table('employees')
             .count()
             .then((res: number) => {
                    try {
                        expect(res).to.be.an('number');
                        expect(res).to.be.equals(4);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If the operation isn't done over an array, the operation should return an error", (done: Function) => {
         fn.table('employees')
             .count()
             .count()
             .then((res: number) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.a('string');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('project', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').project('hi', 'bye')).to.be.an('object');
     });
     it('If the operation is succesful, the result is all the objects of the table but only with the specified properties', (done: Function) => {
         fn.table('employees')
             .project('id', 'firstname')
             .then((res: {id: string, firstname: string}[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        res.forEach(o => {
                            expect(o).to.be.an('object');
                            expect(o).to.have.all.keys(['id', 'firstname']);
                            expect(o).to.not.have.all.keys(['surname', 'department']);
                        })
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('The operation can be done over a json object, and the result should be an object with the projected attributes', (done: Function) => {
         fn.table('employees', '1')
             .project('id')
             .then((res: {id: string}) => {
                    try {
                        expect(res).to.be.an('object').that.has.all.keys('id');
                        expect(res).to.not.have.all.keys(['surname', 'department', 'firstname']);
                        expect(res.id).to.be.equal('1');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('If the function is called with no parametters, the operation should return an error', (done: Function) => {
         fn.table('employees')
             .project()
             .then((res: undefined) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.a('string');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If the operation isn't done over an array, the operation should return an error", (done: Function) => {
         fn.table('employees')
             .count()
             .project('id', 'firstname')
             .then((res: {id: string, firstname: string}[]) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.a('string');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('reduce', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').reduce((result: object[], o: any) => {
                result.push(o);
                return result;
            }, [])).to.be.an('object');
     });
     it('If the operation is succesful, the result is the table with the item changes specified by the passed function', (done: Function) => {
         fn.table('employees')
             .reduce((result: Employee[], o: Employee) => {
                 o.department = '1';
                 result.push(o);
                 return result;
             }, [])
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        res.forEach(o => {
                            expect(o).to.be.an('object');
                            expect(o).to.have.all.keys(['id', 'firstname', 'surname', 'department']);
                            expect(o.department).to.be.equal('1');
                        });
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('The operation can be done over a json object, and the result should be specified by the fucntion and initial accumulator passed', (done: Function) => {
         fn.table('employees', '1')
             .reduce((accum: string[], o: string) => {
                 if(typeof o === 'string')
                     accum.push(o);
                 return accum;
             })
             .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        expect(res).to.have.members(['1', 'Paquito', 'Chocolatero', '1']);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If the operation isn't done over an object, the operation should return an error", (done: Function) => {
         fn.table('employees')
             .count()
             .reduce((result: Employee[], o: Employee) => {
                 o.department = '1';
                 result.push(o);
                 return result;
             }, [])
             .then((res: object[]) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.a('string');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('map', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').map((o: Employee) => o.id)).to.be.an('object');
     });
     it('If the operation is succesful, the result are the items of the table but mapped by the specified function', (done: Function) => {
         fn.table('employees')
             .map('id')
             .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        res.forEach(o => {
                            expect(o).to.be.a('string');
                            expect(Number.parseInt(o)).to.be.within(1, 4);
                        });
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('The operation can be done over a json object, and the result should be an array', (done: Function) => {
         fn.table('employees', '1')
             .map((o: string, key: string) => key)
             .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        expect(res).to.have.members(['firstname', 'id', 'department', 'surname']);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If the operation isn't done over an object, the operation should return an error", (done: Function) => {
         fn.table('employees')
             .count()
             .map((o: Employee) => o.id)
             .then((res: object[]) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.a('string');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('filter', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').filter('id')).to.be.an('object');
     });
     it('If the operation is succesful, the result are the items of the table that pass the filter', (done: Function) => {
         fn.table('employees')
             .filter('id')
             .then((res: Employee[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        res.forEach(o => {
                            expect(o).to.be.an('object');
                            expect(o).to.have.all.keys(['id', 'firstname', 'surname', 'department']);
                        });
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('The operation can be done over a json object, and the result should be an array', (done: Function) => {
         fn.table('employees', '1')
             .filter((o: string, key: string) => key === 'id')
             .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(1);
                        expect(res).to.have.members(['1']);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it("If the operation isn't done over an object, the operation should return an error", (done: Function) => {
         fn.table('employees')
             .count()
             .map((o: Employee) => o.id)
             .then((res: object[]) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.a('string');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('join', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.table('employees').table('departments').join('department', 'id')).to.be.an('object');
     });
     it('If the operation is succesful, the result is a joined table', (done: Function) => {
         fn.table('employees')
             .table('departments')
             .join('department', 'id')
             .then((res: object[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(4);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('If the operation fail, the resolution should be an error', (done: Function) => {
         fn.table('employees')
             .join('department', 'id')
             .then((res: object[]) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.not.be.null;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('insert', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.insert('departments', [{id: '7', name: 'Sales'}, {id: '5', name: 'Comercial'}])).to.be.an('object');
     });
     it('If the operation is succesful, the result is an id or an array of ids', (done: Function) => {
         fn.insert('departments', [{id: '7', name: 'Sales'}, {id: '5', name: 'Comercial'}])
             .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(2);
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                    }
                    catch (err) {
                        done(err);
                    }
             });
         fn.insert('departments', {id: '8', name: 'Sales'})
             .then((res: string) => {
                    try {
                        expect(res).to.be.a('string').equal('8');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('If the operation is not starter, the operation insert the items on which we are operating', (done: Function) => {
         fn.table('departments')
         .map((o: Department) => {
             o.id = (Number.parseInt(o.id) + 8).toString();
             return o;
            })
         .insert()
             .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(7);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('If the operation it\'s done over an empty array, the result should be an empty array', (done: Function) => {
        fn.insert('employees', [])
            .then((res: string[]) => {
                try {
                    expect(res).to.be.an('array').empty;
                }
                catch (err) {
                    done(err);
                }
            }, (err: Error) => {
                try {
                    expect(err).to.not.be.null;
                }
                catch (err) {
                    done(err);
                }
            });
        fn.table('employees')
            .where('id', '=', 'x')
            .insert()
            .then((res: string[]) => {
                try {
                    expect(res).to.be.an('array').empty;
                    done()
                }
                catch (err) {
                    done(err);
                }
            }, (err: Error) => {
                try {
                    expect(err).to.not.be.null;
                    done()
                }
                catch (err) {
                    done(err);
                }
            });
     });
     it('If the operation fail, the resolution should be an error', (done: Function) => {
         fn.insert('employee', {id: '7', name: 'Sales'})
             .then((res: string) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.not.be.null;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});

describe('delete', () => {
     it('The function should return a reference to the self object', () => {
         expect(fn.delete('employees', '1')).to.be.an('object');
     });
     it('If the operation is succesful, the result is an id or an array of ids', (done: Function) => {
         fn.delete('departments', ['5', '7'])
             .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(2);
                        expect(res).to.have.members(['5', '7']);
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                    }
                    catch (err) {
                        done(err);
                    }
             });
         fn.delete('departments', '8')
             .then((res: string) => {
                    try {
                        expect(res).to.be.a('string').equals('8');
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('If the operation is not starter, the operation delete the items on which we are operating', (done: Function) => {
          fn.table('departments', '9')
             .project('id')
             .delete()
             .then((res: string) => {
                    try {
                        expect(res).to.be.an('string').equal('9');
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                    }
                    catch (err) {
                        done(err);
                    }
             });
             fn.table('departments', ['10','11','12'])
                 .project('id')
                 .delete()
                 .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(3);
                        expect(res).to.have.members(['10','11','12']);
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                    }
                    catch (err) {
                        done(err);
                    }
             });
            fn.table('departments', '13')
                .reduce((accum: string, o: string | number[], key: string) => {
                    if(key === 'id')
                        return o;
                    else
                        return accum;
                }, '')
                .delete()
                .then((res: string) => {
                try {
                    expect(res).to.be.an('string').equal('13');
                }
                catch (err) {
                    done(err);
                }
            }, (err: Error) => {
                try {
                    expect(err).to.be.undefined;
                }
                catch (err) {
                    done(err);
                }
            });
         fn.table('departments')
             .reduce((accum: string[], o: Department) => {
                 if(Number.parseInt(o.id) > 13)
                     accum.push(o.id)
                 return accum
                })
             .delete()
             .then((res: string[]) => {
                    try {
                        expect(res).to.be.an('array');
                        expect(res).to.have.lengthOf(2);
                        expect(res).to.have.members([ '15', '16']);
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.be.undefined;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
     it('If the operation it\'s done over an empty array, the result should be an empty array', (done: Function) => {
        fn.delete('employees', [])
            .then((res: string[]) => {
                try {
                    expect(res).to.be.an('array').empty;
                }
                catch (err) {
                    done(err);
                }
            }, (err: Error) => {
               try {
                    expect(err).to.not.be.null;
                    done()
                }
                catch (err) {
                    done(err);
                }
            });
        fn.table('employees')
            .where('id', 'x')
            .delete()
            .then((res: string[]) => {
                try {
                    expect(res).to.be.an('array').empty;
                    done()
                }
                catch (err) {
                    done(err);
                }
            }, (err: Error) => {
                try {
                    expect(err).to.not.be.null;
                    done()
                }
                catch (err) {
                    done(err);
                }
            });
     });
     it('If the operation fail, the resolution should be an error', (done: Function) => {
         fn.delete('employee', '3')
             .then((res: string) => {
                    try {
                       expect(res).to.be.undefined;
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.not.be.null;
                    }
                    catch (err) {
                        done(err);
                    }
             });
             fn.delete('employees', 'hola')
             .then((res: string) => {
                    try {
                       expect(res).to.be.undefined;
                       done();
                    }
                    catch (err) {
                        done(err);
                    }
                }, (err: Error) => {
                    try {
                        expect(err).to.not.be.null;
                        done();
                    }
                    catch (err) {
                        done(err);
                    }
             });
     });
});
