import fn from './index'
import dynamo from './adapters/fn-dynamo'
import s3 from './adapters/fn-s3'
import * as fs from 'fs'

// Dynamo

fn.setDB(dynamo)

fn.table('employees')
    .then((res: Array<Object>) => {
        console.log('\nTable employees')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

fn.table('departments')
    .then((res: Array<Object>) => {
        console.log('\nTable departments')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

fn.insert('employees', {id: "5", firstname: "Pepe", surname: "Chocolatero", department: "1"})
    .then((res: string) => {
        console.log('\nInsert of the employee: {id: "5", firstname: "Pepe", surname: "Chocolatero", department: "1"}')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

fn.delete('employees', '1')
    .then((res: string) => {
        console.log('\nDelete of the employee with id 1')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

fn.table('employees')
    .then((res: Array<Object>) => {
        console.log('\nThe table employees after the insert and delete')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

fn.table('employees')
    .table('departments')
    .join('department', 'id')
    .then((res: Array<Object>) => {
        console.log('\nJoin of the table employees and departments')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

fn.table('departments')
    .reduce((result: Array<any>, o: any) => {
        if (o.floor.length === 2)
            result.push(o) 
        return result
    })
    .count()
    .then((res: number) => {
        console.log('\nThe number of departments that are located in 2 different floors')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

fn.table('employees')
    .reduce((result: Array<any>, o: any) => {
        if (o.firstname[0] === 'P' || o.firstname[0] === 'p')
            result.push(o) 
        return result
    })
    .orderBy('firstname', 'desc')
    .first(2)
    .then((res: Array<Object>) => {
        console.log('\nFind the last 2 employees which names start with the letter "P"')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })
    
fn.table('employees')
    .table('departments')
    .join('department', 'id')
    .where('dept_name', 'Logistic')
    .project('firstname', 'surname')
    .orderBy('firstname')
    .then((res: Array<Object>) => {
        console.log('\nFind the name and surname of the employees in the logistic department, ordered ascendingly by the name')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

// S3

fn.setStorage(s3)

fn.bucket('devonfactory-odr')
    .then((res: Array<string>) => {
        console.log('\nListing the objects of the bucket devonfactory-odr')
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })

fn.bucket('devonfactory-odr', 'lunchroom.png')
    .then((res: Buffer) => {
        console.log('\nGetting the object lunchroom.png from devonfactory-odr')
        console.log(res)
        console.log(Buffer.isBuffer(res))
    }, (err: Error) => {
        console.log(err)
    })

fs.readFile('./yarn.lock', (err, data) => {
    if(err)
        console.log(err)
    else {
        fn.upload('oasp4fn', 'yarn.lock', data, 'text/plain')
            .then((res: string) => {
                console.log("\nReading a file and updloading to s3")
                console.log(Buffer.isBuffer(data))
                console.log(res)
            }, (err: Error) => {
                console.log(err)
            })
    }
})

fn.deleteObject('oasp4fn', 'yarn.lock')
    .then((res: string) => {
        console.log("\nDeleting the object yarn.lock from oasp4fn")
        console.log(res)
    }, (err: Error) => {
        console.log(err)
    })