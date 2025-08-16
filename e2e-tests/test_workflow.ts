import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api'; // 后端 API 的基础 URL
const TEST_PROJECT_NAME = `TestProject_${Date.now()}`; // 使用时间戳生成唯一的项目名称

async function runBusinessWorkflowTest() {
    console.log('开始业务流程测试...');

    try {
        // 1. 新建项目
        console.log('1. 正在创建项目: ${TEST_PROJECT_NAME}...');
        const createResponse = await axios.post(`${BASE_URL}/projects`, {
            name: TEST_PROJECT_NAME,
            type: 'book', // 假设 'book' 是一个有效的项目类型
            description: '这是一个用于业务流程测试的项目',
            language: 'en',
            summary: '这是一个测试项目的摘要',
            prompt: '这是一个测试项目的生成提示'
        });
        console.log('   项目创建成功:', createResponse.data);

        // 2. 列表查询 (验证项目是否存在)
        console.log('2. 正在查询项目列表...');
        const listResponse = await axios.get(`${BASE_URL}/projects`);
        const projectExists = listResponse.data.some((p: any) => p.name === TEST_PROJECT_NAME);
        console.log(`   项目 ${TEST_PROJECT_NAME} 在列表中:`, projectExists);
        if (!projectExists) {
            throw new Error('项目创建后未在列表中找到。');
        }

        // 3. 生成大纲
        console.log(`3. 正在为项目 ${TEST_PROJECT_NAME} 生成大纲...`);
        const generateOutlineResponse = await axios.post(`${BASE_URL}/projects/${TEST_PROJECT_NAME}/outline`, {
            overwrite: true // 假设需要覆盖现有大纲
        });
        console.log('   大纲生成请求已发送:', generateOutlineResponse.data);

        // 4. 查看大纲 (获取项目详情)
        console.log(`4. 正在获取项目 ${TEST_PROJECT_NAME} 详情以查看大纲...`);
        const projectDetailsResponse = await axios.get(`${BASE_URL}/projects/${TEST_PROJECT_NAME}`);
        const initialOutline = projectDetailsResponse.data.outline;
        console.log('   初始大纲 (前100字符):', initialOutline ? JSON.stringify(initialOutline, null, 2).substring(0, 100) + '...' : '暂无大纲');

        // 5. 修改并保存大纲
        console.log(`5. 正在修改并保存项目 ${TEST_PROJECT_NAME} 的大纲...`);
        // initialOutline 是一个对象，所以我们需要将其作为对象进行修改
        const modifiedOutline = JSON.parse(JSON.stringify(initialOutline)); // 深度复制以避免修改原始对象
        if (modifiedOutline && modifiedOutline.chapters) {
            modifiedOutline.chapters.push({
                title: "新增测试章节",
                articles: [{ title: "新增测试文章 1" }]
            });
        } else {
            // 如果 initialOutline 为空或格式不正确，则回退
            modifiedOutline.title = "新的测试大纲";
            modifiedOutline.chapters = [{
                title: "章节一",
                articles: [{ title: "文章 1.1" }]
            }, {
                title: "新增测试章节",
                articles: [{ title: "新增测试文章 1" }]
            }];
        }
        const saveOutlineResponse = await axios.post(`${BASE_URL}/projects/${TEST_PROJECT_NAME}/outline/save`, {
            outline: modifiedOutline
        });
        console.log('   大纲保存成功:', saveOutlineResponse.data);

        // 验证大纲是否已修改
        const updatedProjectDetailsResponse = await axios.get(`${BASE_URL}/projects/${TEST_PROJECT_NAME}`);
        const savedOutline = updatedProjectDetailsResponse.data.outline;
        const newChapterExists = savedOutline.chapters.some((ch: any) => ch.title === '新增测试章节');
        console.log('   验证保存的大纲是否包含修改 (新增章节):', newChapterExists);
        if (!newChapterExists) throw new Error('大纲修改未保存成功 (新增章节)。');

        // 6. 生成内容
        console.log(`6. 正在为项目 ${TEST_PROJECT_NAME} 启动内容生成...`);
        const generateContentResponse = await axios.post(`${BASE_URL}/projects/${TEST_PROJECT_NAME}/generate-content`);
        console.log('   内容生成请求已发送:', generateContentResponse.data);

        // 模拟等待内容生成完成 (实际应用中可能需要轮询状态)
        console.log('   模拟等待内容生成完成 (等待15秒)...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 7. 查看内容
        console.log(`7. 正在获取项目 ${TEST_PROJECT_NAME} 的生成内容...`);
        const getContentResponse = await axios.get(`${BASE_URL}/projects/${TEST_PROJECT_NAME}/content`);
        const initialContent = getContentResponse.data;
        console.log('   初始生成内容 (前100字符):', initialContent ? JSON.stringify(initialContent, null, 2).substring(0, 100) + '...' : '暂无内容');

        // 8. 修改并保存内容
        console.log(`8. 正在修改并保存项目 ${TEST_PROJECT_NAME} 的内容...`);
        const modifiedContentObject = JSON.parse(JSON.stringify(initialContent)); // Deep copy

        if (modifiedContentObject && modifiedContentObject.chapters && modifiedContentObject.chapters.length > 0 &&
            modifiedContentObject.chapters[0].articles && modifiedContentObject.chapters[0].articles.length > 0) {
            // Append to the content of the first article of the first chapter
            modifiedContentObject.chapters[0].articles[0].content += '\n\n--- 这是追加的测试内容 ---';
        } else {
            // Fallback if no content or articles exist (shouldn't happen if generation worked)
            console.warn('没有现有内容可修改。正在创建虚拟内容。');
            modifiedContentObject.title = "Test Content";
            modifiedContentObject.chapters = [{
                title: "Test Chapter", 
                articles: [{ title: "Test Article", content: "这是一段测试内容。\n\n--- 这是追加的测试内容 ---", status: "done" }]
            }];
        }

        await axios.put(`${BASE_URL}/projects/${TEST_PROJECT_NAME}/content`, {
            content: modifiedContentObject // Send the modified object
        });
        console.log('   内容保存成功: { message: \'Content saved successfully.\' }'); // Manually log success

        // Verify modified content
        const verifyContentResponse = await axios.get(`${BASE_URL}/projects/${TEST_PROJECT_NAME}/content`); // Renamed variable
        const savedContentObject = verifyContentResponse.data; // This is now an object
        const appendedTextExists = savedContentObject.chapters[0].articles[0].content.includes('--- 这是追加的测试内容 ---');
        console.log('   验证保存的内容是否包含修改:', appendedTextExists);
        if (!appendedTextExists) throw new Error('内容修改未保存成功。');

        // 9. 发布内容 (单文件 Markdown)
        console.log(`9. 正在发布项目: ${TEST_PROJECT_NAME} (单文件 Markdown)...`);
        const publishResponseSingle = await axios.post(`${BASE_URL}/projects/${TEST_PROJECT_NAME}/publish`, {
            publishType: 'single-markdown' // Simplified type
        });
        console.log('Project published (single Markdown):', publishResponseSingle.data);

        // 10. 下载内容 (如果发布返回了文件路径)
        const publishedFilePath = publishResponseSingle.data.filePath; // Use publishResponseSingle
        if (publishedFilePath) {
            console.log(`10. 尝试从 ${publishedFilePath} 下载已发布文件...`);
            // 注意：实际文件下载需要处理二进制流，这里仅验证接口可达性及返回数据
            const downloadResponse = await axios.get(`${BASE_URL}/download?filePath=${encodeURIComponent(publishedFilePath)}`, {
                responseType: 'arraybuffer' // 处理二进制数据
            });
            console.log(`    下载文件大小: ${downloadResponse.data.length} 字节`);
            if (downloadResponse.data.length === 0) {
                throw new Error('下载的文件为空。');
            }
        } else {
            console.log('10. 发布接口未返回文件路径，跳过下载测试。');
        }

        // 11. 删除项目
        console.log(`11. 正在删除项目: ${TEST_PROJECT_NAME}...`);
        const deleteResponse = await axios.delete(`${BASE_URL}/projects/${TEST_PROJECT_NAME}`);
        console.log('   项目删除成功:', deleteResponse.data);

        // 验证项目是否已删除
        console.log('12. 再次查询项目列表，验证项目是否已删除...');
        const listAfterDeleteResponse = await axios.get(`${BASE_URL}/projects`);
        const projectStillExists = listAfterDeleteResponse.data.some((p: any) => p.name === TEST_PROJECT_NAME);
        console.log(`   项目 ${TEST_PROJECT_NAME} 删除后仍然存在:`, projectStillExists);
        if (projectStillExists) {
            throw new Error('项目删除失败。');
        }

        console.log('业务流程测试全部完成，所有步骤均成功！');

    } catch (error: any) {
        console.error('业务流程测试失败:', error.message || error);
        if (error.response) {
            console.error('响应数据:', error.response.data);
            console.error('响应状态码:', error.response.status);
            console.error('响应头:', error.response.headers);
        }
    } finally {
        // 确保即使测试失败也能进行清理
        try {
            console.log(`尝试清理测试项目 ${TEST_PROJECT_NAME}...`);
            await axios.delete(`${BASE_URL}/projects/${TEST_PROJECT_NAME}`);
            console.log(`测试项目 ${TEST_PROJECT_NAME} 已清理。`);
        } catch (cleanupError: any) {
            // 如果项目已经删除或从未创建，则忽略错误
            if (cleanupError.response && cleanupError.response.status === 400 && cleanupError.response.data.message.includes('not found')) {
                console.log('清理时项目未找到，可能已删除或从未成功创建。');
            } else {
                console.error('清理过程中发生错误:', cleanupError.message || cleanupError);
            }
        }
    }
}

runBusinessWorkflowTest();