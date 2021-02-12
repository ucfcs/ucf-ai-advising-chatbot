import json
import numpy as np
import random
import torch
import torch.nn as nn
from model import ChatNeuralNet
from torch.utils.data import Dataset, DataLoader
from utils_nltk import bag_of_words, tokenize, stem
from file_utils import import_csv


file_name = 'entities.csv'
data = import_csv(file_name)




# # Open and load the intents.
# with open('intents_testing.json', 'r') as f:
#     intents = json.load(f)

all_words = []
tags = []
xy = []

# Set up the intents for training.
# for entity in data['entity']:
    
#     tag = intent['tag']
#     tags.append(tag)

#     for pattern in intent['patterns']:

#         w = tokenize(pattern)
#         all_words.extend(w)
#         xy.append((w, tag))

# # Set the ignore words, perform stemming, and sort.
# ignore_words = ['?', '.', '!']
# all_words = [stem(w) for w in all_words if w not in ignore_words]
# all_words = sorted(set(all_words))
# tags = sorted(set(tags))

# # Report stemming statistics.
# print(len(xy), "patterns")
# print(len(tags), "tags:", tags)
# print(len(all_words), "unique stemmed words:", all_words)

# X_train = []
# y_train = []

# for (pattern_sentence, tag) in xy:

#     # Set the bag of words for each pattern.
#     bag = bag_of_words(pattern_sentence, all_words)
#     X_train.append(bag)

#     # Set the class labels.
#     label = tags.index(tag)
#     y_train.append(label)

# # Set the training data.
# X_train = np.array(X_train)
# y_train = np.array(y_train)

# # Define the hyperparameters.
# num_epochs = 2000
# batch_size = 8
# learning_rate = 0.001
# input_size = len(X_train[0])
# hidden_size = 8
# num_classes = len(tags)
# print(input_size, num_classes)


# class ChatDataset(Dataset):

#     def __init__(self):
#         self.n_samples = len(X_train)
#         self.x_data = X_train
#         self.y_data = y_train

#     def __getitem__(self, index):
#         return self.x_data[index], self.y_data[index]

#     def __len__(self):
#         return self.n_samples


# # Define the dataset and dataloader.
# dataset = ChatDataset()
# train_loader = DataLoader(dataset=dataset,
#                           batch_size=batch_size,
#                           shuffle=True,
#                           num_workers=0)

# # Set the device to a GPU if available.
# device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# # Define the model.
# model = ChatNeuralNet(input_size, hidden_size, num_classes).to(device)

# # Set the loss function and optimizer.
# criterion = nn.CrossEntropyLoss()
# optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

# for epoch in range(num_epochs):

#     for (words, labels) in train_loader:

#         words = words.to(device)
#         labels = labels.to(dtype=torch.long).to(device)
        
#         # Perform forward propagation.
#         outputs = model(words)
#         loss = criterion(outputs, labels)
        
#         # Perform backpropagation.
#         optimizer.zero_grad()
#         loss.backward()
#         optimizer.step()

#     # Report the loss.    
#     if (epoch+1) % 100 == 0:
#         print (f'Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}')

# # Report the final loss.
# print(f'final loss: {loss.item():.4f}')

# # Save the model components.
# data = {
# "model_state": model.state_dict(),
# "input_size": input_size,
# "hidden_size": hidden_size,
# "num_classes": num_classes,
# "all_words": all_words,
# "tags": tags
# }

# # Save the model to "data.pth".
# FILE = "data.pth"
# torch.save(data, FILE)

# # Report completion of training.
# print(f'Training complete. File saved to {FILE}.')