#!/bin/bash

# =====================================================================
# 脚本名称: clear_postgres_db.sh
# 脚本功能: 自动彻底清空 PostgreSQL 数据库 (删除并重建整个数据库)
# 适用数据库: car_rental_dev
# 风险提示: 这是一个破坏性操作，会永久删除数据。请谨慎使用并备份数据！
#           此版本为自动化执行，无任何确认步骤。
# =====================================================================

# --- 数据库连接配置 ---
DB_NAME="car_rental_dev"
PGUSER="kanata"         # 您的 PostgreSQL 用户名 (通常是 postgres 或您自定义的用户)
PGHOST="localhost"        # 数据库主机，如果是远程数据库请修改
PGPORT="5432"             # 数据库端口

# --- 其他配置 ---
# 强制删除数据库并重建。此版本为自动化，此选项固定为 true，无手动确认。
FORCE_DROP=true

# =====================================================================

echo "---------------------------------------------------------"
echo "尝试自动清空 PostgreSQL 数据库: ${DB_NAME}"
echo "连接用户: ${PGUSER}"
echo "主机: ${PGHOST}:${PGPORT}"
echo "---------------------------------------------------------"

# 检查 psql 命令是否存在
if ! command -v psql &> /dev/null
then
    echo "错误: psql 命令行工具未找到。请确保 PostgreSQL 客户端已安装并配置在 PATH 中。"
    exit 1
fi

echo "强制删除并重建数据库 '${DB_NAME}'..."

# 尝试断开所有连接
echo "尝试断开所有连接到数据库 '${DB_NAME}'..."
# 注意: 如果有活跃连接且无法断开，DROP DATABASE 会失败。
# 这里使用 '-c' 而不是管道，确保命令执行在单个 psql 会话中。
psql -U "${PGUSER}" -h "${PGHOST}" -p "${PGPORT}" -d postgres -c \
"SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

# 删除数据库
echo "删除数据库 '${DB_NAME}'..."
if psql -U "${PGUSER}" -h "${PGHOST}" -p "${PGPORT}" -d postgres -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";"; then
    echo "数据库 '${DB_NAME}' 删除命令发送成功。"
else
    echo "错误: 删除数据库 '${DB_NAME}' 失败。请检查权限或是否有未断开的连接。"
    exit 1
fi

# 创建数据库
echo "创建数据库 '${DB_NAME}'..."
if psql -U "${PGUSER}" -h "${PGHOST}" -p "${PGPORT}" -d postgres -c "CREATE DATABASE \"${DB_NAME}\";"; then
    echo "数据库 '${DB_NAME}' 创建成功。"
    echo "数据库 '${DB_NAME}' 已成功清空 (通过删除并重建)。"
else
    echo "错误: 创建数据库 '${DB_NAME}' 失败。"
    exit 1
fi

echo "---------------------------------------------------------"
echo "脚本执行完毕。"
echo "---------------------------------------------------------"