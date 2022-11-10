<script setup lang="ts">
import { computed, ref } from 'vue';
import cookieUse from './useCookie'
import { Search, Plus, ArrowDown } from '@element-plus/icons-vue'
import ContentEditable from '@/components/ContentEditable.vue';
import { cookieToString, SameSiteStatus } from '@/utils/cookies'
import { ElMessage } from 'element-plus'
import tabInfo from '@/utils/tabs/useTab'
import MySubscribe from './MySubscribe.vue'
import { getUrlDomain } from '@/utils';

const { isHttpTab, currentDomain } = tabInfo

const { cookiesByDomain, bindToCurrent, applyToCurrent, updateField, delCookieItem, delAllCookie } = cookieUse

// 页面过滤、搜索、展示等相关逻辑
const { searchText, filteredCookies, domains, copyCookie } = (() => {
    const searchText = ref('')

    const filteredCookies = computed(() => {
        let result = {} as typeof cookiesByDomain.value
        // 如果是 http 开头则仅搜索域名，方便直接复制地址栏来进行搜索
        const searchTextValue = searchText.value?.startsWith('http') ? getUrlDomain(searchText.value) : searchText.value
        for (const key in cookiesByDomain.value) {
            if (!searchTextValue || key.includes(searchTextValue)) {
                result[key] = cookiesByDomain.value[key]
            }
        }

        return result
    })
    // 对域名进行排序
    const domains = computed(() => {
        const keys = Object.keys(filteredCookies.value)
        // 以域名维度排序
        keys.sort((a, b) => {
            a = a.toLocaleLowerCase()
            b = b.toLocaleLowerCase()
            const currentDomainValue = currentDomain.value?.toLocaleLowerCase()
            const currentDomainInA = currentDomainValue?.includes(a.replace(/^\./, '')) && -1
            const currentDomainInB = currentDomainValue?.includes(b.replace(/^\./, '')) && 1
            return currentDomainInA || currentDomainInB || a.replace(/^\./, '').localeCompare(b.replace(/^\./, ''))
        })

        return keys
    })

    // 拷贝 cookie 逻辑
    const copyCookie = async (key: string, index: number, type = "text") => {
        const cookie = filteredCookies.value[key][index]
        const str = type === 'text' ? cookieToString(cookie) : JSON.stringify(cookie, null, 2)
        await navigator.clipboard.writeText(str)
        ElMessage.success('复制成功！')
    }

    return {
        searchText,
        filteredCookies,
        domains,
        copyCookie
    }
})()



// 订阅相关抽屉
const { subscribeDrawer, toggleSubscribeDrawer } = (() => {
    const subscribeDrawer = ref(false)
    const toggleSubscribeDrawer = () => subscribeDrawer.value = !subscribeDrawer.value
    return {
        subscribeDrawer,
        toggleSubscribeDrawer
    }
})()

const activeName = ref('')

</script>


<template>
    <div class="cookie-nav">
        <el-link @click="toggleSubscribeDrawer" v-if="isHttpTab">我的订阅</el-link>
    </div>

    <el-input v-model="searchText" placeholder="搜索" :prefix-icon="Search" />

    <el-collapse accordion v-model="activeName">
        <el-collapse-item v-for="domain in domains" :key="domain" :name="domain">
            <template #title>
                <div class="collapse-header-content">
                    {{ domain }} ({{ filteredCookies[domain].length }})
                    <el-button type="primary" size="small" class="cookie-item-header-btn"
                        @click.stop="applyToCurrent(domain)" v-if="isHttpTab">应用</el-button>
                    <el-button type="primary" size="small" class="cookie-item-header-btn"
                        @click.stop="bindToCurrent(domain)" v-if="isHttpTab">订阅</el-button>
                    <el-button type="primary" size="small" class="cookie-item-header-btn" @click.stop="">新增</el-button>
                    <el-button type="primary" size="small" class="cookie-item-header-btn"
                        @click.stop="delAllCookie(domain)">删除</el-button>
                </div>
            </template>

            <Transition>
                <el-card shadow="hover" v-if="activeName === domain">
                    <el-table :data="filteredCookies[domain]" stripe style="width: 100%">
                        <el-table-column prop="name" label="名称">
                            <template #default="{ row, $index }">
                                <ContentEditable :value="row.name" class="content-editable"
                                    @blur="evt => updateField(domain as string, $index, 'name', evt.target.value, row.name)">
                                </ContentEditable>
                            </template>
                        </el-table-column>
                        <el-table-column prop="value" label="值" show-overflow-tooltip>
                            <template #default="{ row, $index }">
                                <ContentEditable :value="row.value" class="content-editable"
                                    @blur="evt => updateField(domain as string, $index, 'value', evt.target.value, row.value)">
                                </ContentEditable>
                            </template>
                        </el-table-column>
                        <el-table-column prop="path" label="路径" show-overflow-tooltip>
                            <template #default="{ row, $index }">
                                <ContentEditable :value="row.path" class="content-editable"
                                    @blur="evt => updateField(domain as string, $index, 'path', evt.target.value, row.path)">
                                </ContentEditable>
                            </template>
                        </el-table-column>
                        <el-table-column prop="expirationDate" label="过期时间" min-width="250">
                            <template #default="{ row, $index }">
                                <el-date-picker
                                    :model-value="row.expirationDate ? new Date(row.expirationDate * 1000) : null"
                                    @change="(val: number) => updateField(domain as string, $index, 'expirationDate', val, row.expirationDate)"
                                    placeholder="session" type="datetime" value-format="x" :shortcuts="[]" />
                            </template>
                        </el-table-column>
                        <el-table-column prop="sameSite" label="Same Site" show-overflow-tooltip min-width="140">
                            <template #default="{ row, $index }">
                                <el-select :model-value="row.sameSite"
                                    @change="(val: SameSiteStatus) => updateField(domain as string, $index, 'sameSite', val, row.sameSite)"
                                    size="small">
                                    <el-option v-for="item in SameSiteStatus" :key="item" :label="item" :value="item" />
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column prop="httpOnly" label="Http Only" min-width="90">
                            <template #default="{ row, $index }">
                                <el-checkbox :model-value="row.httpOnly"
                                    @change="(val: boolean) => updateField(domain as string, $index, 'httpOnly', val, row.httpOnly)"
                                    size="small" />
                            </template>
                        </el-table-column>
                        <el-table-column prop="secure" label="Secure">
                            <template #default="{ row, $index }">
                                <el-checkbox :model-value="row.secure"
                                    @change="(val: boolean) => updateField(domain as string, $index, 'secure', val, row.secure)"
                                    size="small" />
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" width="140">
                            <template #header>
                                <div class="flex-op">
                                    操作 <el-button type="primary" size="small" link>
                                        <el-icon>
                                            <Plus />
                                        </el-icon>
                                    </el-button>
                                </div>
                            </template>
                            <template #default="{ $index }">
                                <div class="table-op">
                                    <el-button link type="primary" size="small" @click="''">编辑
                                    </el-button>

                                    <el-dropdown size="small">
                                        <span class="el-dropdown-link">
                                            <el-button link type="primary" size="small"
                                                @click="copyCookie(domain as string, $index)">
                                                复制<el-icon class="el-icon--right">
                                                    <arrow-down />
                                                </el-icon>
                                            </el-button>
                                        </span>
                                        <template #dropdown>
                                            <el-dropdown-menu>
                                                <el-dropdown-item @click="copyCookie(domain as string, $index, 'json')">
                                                    复制
                                                    JSON</el-dropdown-item>
                                            </el-dropdown-menu>
                                        </template>
                                    </el-dropdown>

                                    <el-button link type="primary" size="small"
                                        @click="delCookieItem(domain as string, $index)">删除
                                    </el-button>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </Transition>
        </el-collapse-item>
    </el-collapse>

    <el-drawer v-model="subscribeDrawer" title="我的订阅" direction="rtl" size="80%">
        <MySubscribe />
    </el-drawer>
</template>

<style lang="less" scoped>
.collapse-header-content {

    width: 100%;

    .cookie-item-header-btn {
        margin-left: 12px;
        transition: all .3s;
        opacity: 0;
    }

    &:hover {
        .cookie-item-header-btn {
            opacity: 1;
        }
    }
}

.content-editable {
    min-height: 23px;
}

.cookie-nav {
    display: flex;
    justify-content: end;
    margin: 10px 0;
}

.flex-op {
    display: flex;
    gap: 10px;
}

.table-op {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>