npx ts-node -T libs/generateTableType.ts

SOURCE_DIR=./types/tables
OUTPUT_DIR=../data-analysis-system-web/types/db-table-type

rm -rf ${OUTPUT_DIR}

cp -r ${SOURCE_DIR} ${OUTPUT_DIR}
