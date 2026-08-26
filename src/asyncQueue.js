export class AsyncQueue{

    constructor(){
        //Array which will contain the tasks
        this.queue = [];
        //Flag for avoiding execution of task while another one is being executed
        this.isProcessing = false;
    }

    //Method to add tasks to the queue 
    enqueue(task){
        //This allows to the caller of the task to know if the promise resolved or rejected
        return new Promise((resolve, reject) =>{
            //Add the task with the resolve and reject functions to the queue as a single object
            this.queue.push({
                task: task,
                resolve,
                reject
            });

            //Attempt to run the tasks
            this.process();
        });
    }

    //Method for processing the tasks in the queue
    async process(){
        //Check if any task is being executed to prevent executions 
        if(this.isProcessing){
            return;
        };

        //If there was not a task execution, s
        this.isProcessing = true;

        //Loop for executing all enqueued task up to the moment
        while(this.queue.length > 0){
            //Get the first task and delete it from the queue
            const currentTask = this.queue.shift();

            try {
                //Try to resolve the task
                const result = await currentTask.task();
                currentTask.resolve(result);
            } catch (error) {
                currentTask.reject(result);
            }
        };

        //Set the flag to false when the tasks are all done
        this.isProcessing = false;
    }
};