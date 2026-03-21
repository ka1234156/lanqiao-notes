第一章：裸机任务调度器 (Task Scheduler)

::: tip 🚀 导师导读：系统的时间管理大师
任务调度器是嵌入式系统中的"时间管理大师"，它按预定的时间间隔安排不同的任务执行。告别死循环里的 delay_ms()，让我们拥抱现代的高效架构！
:::

一、 基本概念 🆚 传统开发对比

我们先来看看传统裸机开发和使用调度器架构的核心区别。合理的架构可以让你的单片机性能实现质的飞跃：

优势与维度

说明

实际效果与生活比喻

⏱️ 精准定时

毫秒级任务调度

LED以500ms精确闪烁

🔄 周期执行

不同频率任务共存

按键10ms扫描 + 屏幕100ms刷新

⚡ 非阻塞运行

避免 Delay() 卡死系统

系统永远响应及时

🧩 模块化设计

任务独立开发

方便团队协作与维护

🏆 可预测性

任务执行时间可控

满足实时性要求

二、 结构体基石 (调度器底层逻辑)

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

::: details 🎯 展开学习：2. 访问结构体成员 (点(.) 与 箭头(->))
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

// 主结构体：嵌套了上面两个Employee_t
typedef struct {
    int id;                  
    char name[30];          
    Address_t address;      // 嵌套：地址信息
    Contact_t contact;      // 嵌套：联系方式
} Employee_t;

Employee_t emp1 = {
    .name = "张三",
    .address = { .city = "北京", .street = "中关村大街1号" },
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

三、 调度器核心实现 (标准模板)

调度器的实现主要包含三个部分：任务数组、初始化函数和运行函数。

我们利用 VitePress 的代码选项卡魔法，把它们完美地分类展示，你可以点击下方的标签进行点击交互切换：

::: code-group

// 全局变量，用于存储任务数量
uint8_t task_num;

// 步骤1：先定义结构体类型
typedef struct {
    void (*task_func)(void);   // 函数指针成员：指向任务具体动作
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
    // sizeof(数组) / sizeof(单个元素) = 任务总数
    // 任务数量 = 数组总大小 ÷ 单个任务大小
    task_num = sizeof(scheduler_task) / sizeof(scheduler_task_t);
}


/**
 * @brief 调度器主引擎 (放在 main 的 while(1) 中无休止调用)
 * 遍历任务数组，检查是否有任务需要执行。如果超过执行周期，则执行任务并更新时间。
 */
void scheduler_run(void)
{
    // 遍历任务数组中的所有任务
    for (uint8_t i = 0; i < task_num; i++)
    {
        // 获取当前的系统时间（毫秒），调用 HAL_GetTick() 获取系统当前时间戳
        // get_system_ms() 是底层库提供的函数
        uint32_t now_time = HAL_GetTick();

        // 检查当前时间是否达到任务的执行时间
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

四、 调度器优化技巧 (蓝桥杯必看避坑指南)

在实际的蓝桥杯赛场或企业开发中，下面这几个底层细节往往决定了系统的稳定性：

⚠️ 技巧 1：时间戳溢出处理 (致命 Bug 预防)

由于 32 位计数器最终会溢出，如果设备长期运行（约49.7天），HAL_GetTick() 会归零，导致 now_time >= rate + last_run 这段逻辑逻辑彻底紊乱。

高阶修复方案： 利用无符号整数相减的特性，强制转换为 int32_t 有符号数做差比较：

// 将运算结果强制转换为 int32_t 有符号数
if ((int32_t)(now_time - (scheduler_task[i].last_run + scheduler_task[i].rate_ms)) >= 0) {
    // 执行任务动作
}


::: warning 灵魂拷问
点击下方看看你能否回答这个底层大坑：
:::

::: details 🚨 如果不处理溢出，你的设备连续开机 49.7 天后会发生什么？（点击查看答案）
答：系统瘫痪！

因为当 HAL_GetTick() 溢出归零后，原本的大数值时间戳变成了极小值。如果你直接用 now_time >= rate + last_run 比较，这个条件会长期无法成立，导致你的按键、LED等所有任务永远无法被执行。你的单片机会处于假死状态。

用做差的完美写法可以完美解决这个数学 Bug，这是区分新手和中高级工程师的重要标志。
:::

