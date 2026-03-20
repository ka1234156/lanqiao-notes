第一章：裸机任务调度器 (Task Scheduler)

::: tip ⏱️ 导师导读：系统的时间管理大师
任务调度器是嵌入式系统中的"时间管理大师"，它按预定的时间间隔安排不同的任务执行。告别死循环里的 delay_ms()，让我们拥抱现代的高效架构！
:::

1. 为什么需要任务调度器？

我们先来看看传统裸机开发和使用调度器架构的核心区别：

维度

传统裸机开发 (Bare-Metal)

调度器架构 (Scheduler-Based)

💡 实际效果与生活比喻

精准定时

单任务顺序执行，依赖延时

毫秒级任务调度

LED以500ms精确闪烁

资源消耗

CPU 占用率 100% (忙等待)

具备休眠机制，可低功耗

灯泡常亮 🆚 声控感应灯

周期执行

while(1) 死等轮询

不同频率任务共存

按键10ms扫描 + 屏幕100ms刷新

非阻塞运行

取决于当前耗时任务

避免Delay()卡死系统

永远响应及时

模块化设计

手动时序编排，一人包揽

任务独立开发，团队协作

方便团队协作维护

可预测性

无法保证响应时间

任务执行时间可控

满足实时性要求

2. 调度器基石：结构体高阶语法

结构体以及结构体指针在任务调度器中扮演着最核心的角色（尤其是在任务队列管理和动态分配时）。点击下方交互面板，完整复习 C 语言结构体的 5 种高阶玩法：

::: details 📚 展开学习：1. 结构体变量声明与初始化

/* 方法1：传统方式 */
struct Task {                    // struct Task 是完整的类型名
    char name[32];              // 任务名称
    int priority;              // 优先级
};
struct Task task1 = {"温度检测", 1};  // 声明task1变量并初始化

/* 方法2：typedef别名（推荐🌟） */
typedef struct {                // 定义结构体类型并创建别名，注意：这里没有结构体标签名
    char name[32];
    int priority;
    void (*function)(void);     // 函数指针：指向任务函数
} Task_t;                       // Task_t 就是类型别名
Task_t task2 = {"湿度检测", 2, NULL};  // 使用别名声明

/* 方法3：C99指定初始化（清晰明了） */
Task_t task3 = {
    .name = "压力检测",         // 明确指定成员初始化
    .priority = 3,
    .function = pressure_task   // 指向具体函数
};


:::

::: details 🎯 展开学习：2. 访问结构体成员 (点 与 箭头)
可以使用点运算符(.)访问结构体成员，或使用箭头运算符(->)访问结构体指针的成员。

// 创建任务实例
Task_t my_task = {"显示刷新", 5, refresh_display};

// 📍 点运算符(.)：直接访问
printf("任务: %s\n", my_task.name);      // 读取成员
my_task.priority = 4;                    // 修改成员
my_task.function();                      // 调用函数指针

// 🎯 箭头运算符(->)：指针访问
Task_t* p_task = &my_task;               // 获取指针
printf("优先级: %d\n", p_task->priority); // 通过指针访问
p_task->function();                       // 通过指针调用函数


:::

::: details 🧭 展开学习：3. 结构体指针 (调度器核心！)
结构体指针在任务调度器中扮演重要角色，尤其是在任务队列管理和动态分配任务时。

// 1. 定义学生结构体
typedef struct {
    int id;
    char name[20];
    float score;
} Student_t;

// 2. 创建结构体指针
Student_t* student_ptr = NULL;  // 声明指针，初始化为NULL

// 3. 指向现有结构体变量
Student_t student1 = {1001, "张三", 85.5};
student_ptr = &student1;  // 指针指向student1的地址

// 4. 通过指针访问成员（使用箭头运算符->）
printf("学号: %d\n", student_ptr->id);     // 等同于 (*student_ptr).id
printf("成绩: %.1f\n", student_ptr->score); // 访问成绩

// 5. 动态创建学生（堆内存分配）
Student_t* dynamic_student = malloc(sizeof(Student_t));  // 动态分配内存
if(dynamic_student != NULL) {
    dynamic_student->id = 2001;
    strcpy(dynamic_student->name, "李四");
    
    // 使用完后释放内存
    free(dynamic_student);
    dynamic_student = NULL;  // 防止野指针
}


:::

::: details 🪆 展开学习：4. 结构体嵌套 (复杂系统必备)
结构体可以嵌套其他结构体作为成员，这在复杂系统中非常有用，如定义任务组和依赖关系。

typedef struct {
    char city[20];    
    char street[50];  
} Address_t;

typedef struct {
    char phone[15];   
} Contact_t;

// 主结构体：嵌套了上面两个
typedef struct {
    int id;                  
    char name[30];          
    Address_t address;      // 嵌套：地址信息
    Contact_t contact;      // 嵌套：联系方式
} Employee_t;

Employee_t emp1 = {
    .name = "张三",
    .address = { .city = "北京", .street = "中关村" },
    .contact = { .phone = "13800138000" }
};

printf("城市: %s\n", emp1.address.city); // 连续使用点运算符访问嵌套成员


:::

::: details 🛒 展开学习：5. 结构体数组 (任务队列的载体)
结构体数组是实现任务队列的重要手段，可以批量管理多个任务，便于遍历和调度。

typedef struct {
    char name[30];    
    float price;      
    int quantity;     
    float total;      
} Product_t;

// 购物车数组
Product_t cart[10];
int item_count = 0;   // 当前商品数量

// 添加商品到购物车
void add_to_cart(char* name, float price, int qty) {
    if(item_count < 10) {
        cart[item_count].name = name;
        cart[item_count].price = price;
        cart[item_count].quantity = qty;
        cart[item_count].total = price * qty;
        item_count++;
    }
}


:::

3. 调度器核心实现

调度器的实现主要包含三个部分：任务数组、初始化函数和运行函数。我们使用代码选项卡来分类展示，结合原作者的详细注释：

::: code-group

// 全局变量，用于存储任务数量
uint8_t task_num;

// 步骤1：先定义结构体类型
typedef struct {
    void (*task_func)(void);   // 函数指针成员：当满足条件时被调用的函数
    uint32_t rate_ms;          // 周期（毫秒）：任务的执行周期
    uint32_t last_run;         // 上次执行时间：初始化为0，运行时会被更新
} scheduler_task_t;

// 步骤2：声明并初始化结构体数组 (这是调度器的核心！)
static scheduler_task_t scheduler_task[] =
{
    {Led_Proc, 1, 0},      // LED控制任务：周期1ms
    {Key_Proc, 10, 0},     // 按键扫描任务：周期10ms
    {Sensor_Proc, 100, 0}, // 传感器读取任务：周期100ms
    {Comm_Proc, 50, 0}     // 通信处理任务：周期50ms
};


/**
 * @brief 调度器初始化函数
 * 计算任务数组的元素个数，并将结果存储在 task_num 中
 */
void scheduler_init(void)
{
    // 这里使用了一个常见技巧：通过数组总大小除以单个元素大小，得到数组元素个数。
    // 任务数量 = 数组总大小 ÷ 单个任务大小
    task_num = sizeof(scheduler_task) / sizeof(scheduler_task_t);
}


/**
 * @brief 调度器运行函数
 * 遍历任务数组，检查是否有任务需要执行。如果超过执行周期，则执行任务并更新时间。
 */
void scheduler_run(void)
{
    // 遍历任务数组中的所有任务
    for (uint8_t i = 0; i < task_num; i++)
    {
        // 获取当前的系统时间（毫秒），调用 HAL_GetTick() 获取系统当前时间戳
        uint32_t now_time = HAL_GetTick();

        // 检查当前时间是否达到任务的执行时间
        // ⚠️ 注意：这里原作者指出直接相加有溢出风险，后续我们在优化章节解决！
        if (now_time >= scheduler_task[i].rate_ms + scheduler_task[i].last_run)
        {
            // 更新任务的上次运行时间为当前时间
            scheduler_task[i].last_run = now_time;

            // 执行任务函数
            scheduler_task[i].task_func();
        }
    }
}


:::

4. 调度器进阶应用

在某些复杂场景下，我们需要调度器更加聪明、灵活。以下是三大进阶应用场景及原作者提供的完整代码：

🥇 1. 优先级调度

为任务添加优先级属性，使重要任务优先执行。在某些场景下，我们需要确保关键任务能够及时响应，如安全监控、通信处理等。常见的有：冒泡排序、每次查找最高优先级等。

typedef struct {
    void (*task_func)(void);
    uint32_t rate_ms;
    uint32_t last_run;
    uint8_t priority;  // 🌟 优先级属性，数值越小优先级越高
} priority_task_t;

// 任务按优先级排序函数 (初始化时调用一次即可)
void sort_tasks_by_priority(void) {
    // 使用冒泡排序按优先级对任务数组进行重排
    for (uint8_t i = 0; i < task_num - 1; i++) {
        for (uint8_t j = 0; j < task_num - i - 1; j++) {
            if (scheduler_task[j].priority > scheduler_task[j + 1].priority) {
                // 交换任务位置
                priority_task_t temp = scheduler_task[j];
                scheduler_task[j] = scheduler_task[j + 1];
                scheduler_task[j + 1] = temp;
            }
        }
    }
}


🔋 2. 低功耗管理

通过调度器实现低功耗模式的切换与管理。在电池供电的设备中，当没有任务需要立即执行时，系统可以进入低功耗模式以延长电池寿命。

void scheduler_run_low_power(void)
{
    bool all_tasks_idle = true;             // 🎯 假设所有任务都在休息
    uint32_t time_to_next_task = UINT32_MAX;// 🕒 距离下次任务的时间（先设为最大）
    uint32_t now_time = HAL_GetTick();      // ⏱️ 获取当前系统时间戳
    
    // 检查是否有任务需要立即执行
    for (uint8_t i = 0; i < task_num; i++)
    {
        // 🧮 关键计算：距离任务执行还有多久？
        uint32_t time_to_task = (scheduler_task[i].last_run + scheduler_task[i].rate_ms) - now_time;
        
        // 情况A：时间到了（time_to_task == 0）                     
        if (time_to_task == 0 || time_to_task > scheduler_task[i].rate_ms) {
            scheduler_task[i].last_run = now_time;
            scheduler_task[i].task_func();
            all_tasks_idle = false;         // 🚨 有任务执行，系统不空闲！
        } 
        // 情况B：还没到时间，但需要记录最近的任务
        else if (time_to_task < time_to_next_task) {
            time_to_next_task = time_to_task;
        }
    }
    
    // 如果所有任务都空闲，并且距离下一个任务的时间足够长
    if (all_tasks_idle && time_to_next_task > MIN_SLEEP_TIME) {
        // 进入休眠模式，直到下一个任务时间或外部中断唤醒
        HAL_PWR_EnterSLEEPMode(PWR_MAINREGULATOR_ON, PWR_SLEEPENTRY_WFI);
    }
}


🧩 3. 动态任务管理

在运行时添加、删除或修改任务的能力。根据系统状态需要动态增减任务时，这使调度器更加灵活。

::: details 💻 点击查看：动态增删任务的完整实现代码

typedef struct {
    void (*task_func)(void);
    uint32_t rate_ms;
    uint32_t last_run;
    bool active;  // 🌟 激活状态标志位
} dynamic_task_t;

#define MAX_TASKS 10                    // 最大任务数（容量上限）
dynamic_task_t scheduler_task[MAX_TASKS];
uint8_t task_num = 0;                   // 当前任务数（实际使用量）

// 添加任务
uint8_t add_task(void (*task_func)(void), uint32_t rate_ms) {
    // 🔒 安全检查：任务数量是否超过上限？
    if (task_num >= MAX_TASKS) return 0xFF; 
    
    // 📝 填写新任务的信息
    scheduler_task[task_num].task_func = task_func;
    scheduler_task[task_num].rate_ms = rate_ms;
    scheduler_task[task_num].last_run = HAL_GetTick();
    scheduler_task[task_num].active = true;
    
    return task_num++; // 📈 返回新任务的ID，并增加任务计数
}

// 删除任务
bool remove_task(uint8_t task_id) {
    if (task_id >= task_num) return false;
    
    // 🔄 数组压缩：把被删除位置后面的所有任务往前移动一格
    for (uint8_t i = task_id; i < task_num - 1; i++) {
        scheduler_task[i] = scheduler_task[i + 1];
    }
    task_num--; // 📉 减少任务计数
    return true;
}

// 暂停任务
bool pause_task(uint8_t task_id) {
    if (task_id >= task_num) return false;
    scheduler_task[task_id].active = false; // 只需修改标志位
    return true;
}

// 恢复任务
bool resume_task(uint8_t task_id) {
    if (task_id >= task_num) return false;
    scheduler_task[task_id].active = true;
    scheduler_task[task_id].last_run = HAL_GetTick(); // 重置计时器防止立即执行
    return true;
}


:::

5. 调度器优化技巧 (避坑指南)

在实际的蓝桥杯赛场或企业开发中，下面这几个细节往往决定了系统的稳定性：

⚠️ 技巧 1：时间溢出处理 (致命 Bug 预防)

由于 32 位计数器最终会溢出，如果把时间差当作有符号数，负的表示"还没到时间"，正的表示"时间到了或超时”。这是极其健壮的处理方法：

// 将运算结果强制转换为 int32_t 有符号数
if ((int32_t)(now_time - (scheduler_task[i].last_run + scheduler_task[i].rate_ms)) >= 0) {
    // 执行任务
}


⏱️ 技巧 2：任务执行时间监控

监控任务执行时间，确保没有任务占用过多 CPU 时间。一个任务执行时间过长可能会影响其他任务的及时性。

uint32_t start_time = HAL_GetTick();
scheduler_task[i].task_func(); // 运行你的任务代码

uint32_t execution_time = HAL_GetTick() - start_time;
if (execution_time > MAX_TASK_TIME) {
    // 🚨 记录或报警：处理任务执行时间过长的情况
}


🗂️ 技巧 3：调度器嵌套

可以创建多个不同优先级或时间精度的调度器，以适应不同类型的任务。

// 快速调度器 - 1ms精度的任务
void fast_scheduler_run(void);
// 慢速调度器 - 100ms精度的任务
void slow_scheduler_run(void);

// 在 main 的主循环中：
while (1) {
    fast_scheduler_run();  // 高频扫按键、跑马灯
    slow_scheduler_run();  // 低频刷屏幕、传串口
}
