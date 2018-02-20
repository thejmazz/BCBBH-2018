data <- read.table(file = './data/chr20.tsv', sep = '\t', header = TRUE)
png("plot1.png", width = 480, height = 480, units = "px", bg = "white")
plot(hist(data$interactions))
dev.off()
