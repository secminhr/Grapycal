from grapycal.extension.utils import NodeInfo
from .moduleNode import SimpleModuleNode
from torch import nn
from grapycal import IntTopic, Node, FloatTopic

class BatchNorm2dNode(SimpleModuleNode):
    category = 'torch/nn'
    inputs = ['inp']
    input_edge_limit = [None]
    outputs = ['out']
    display_port_names = False

    def build_node(self):
        super().build_node()
        self.label.set('BatchNorm2d')
        self.num_features = self.add_attribute('num_features',IntTopic,1,editor_type='int')

    def recover_from_version(self, version: str, old: NodeInfo):
        super().recover_from_version(version, old)
        self.recover_attributes('num_features')

    def create_module(self) -> nn.Module:
        return nn.BatchNorm2d(self.num_features.get())
    
    def generate_label(self):
        return f'BatchNorm2d {self.num_features.get()}'

    def forward(self, inp):
        return self.module(inp)

class Dropout2dNode(SimpleModuleNode):
    category = 'torch/nn'
    inputs = ['inp']
    input_edge_limit = [None]
    outputs = ['out']
    display_port_names = False

    def build_node(self):
        super().build_node()
        self.label.set('Dropout2d')
        self.p = self.add_attribute('p',FloatTopic,0.5,editor_type='float')

    def recover_from_version(self, version: str, old: NodeInfo):
        super().recover_from_version(version, old)
        self.recover_attributes('p')

    def create_module(self) -> nn.Module:
        return nn.Dropout2d(self.p.get())
    
    def generate_label(self):
        return f'Dropout2d {self.p.get()}'

    def forward(self, inp):
        return self.module(inp)

class DropoutNode(SimpleModuleNode):
    category = 'torch/nn'
    inputs = ['inp']
    input_edge_limit = [None]
    outputs = ['out']
    display_port_names = False

    def build_node(self):
        super().build_node()
        self.label.set('Dropout')
        self.p = self.add_attribute('p',FloatTopic,0.5,editor_type='float')

    def recover_from_version(self, version: str, old: NodeInfo):
        super().recover_from_version(version, old)
        self.recover_attributes('p')

    def create_module(self) -> nn.Module:
        return nn.Dropout(self.p.get())
    
    def generate_label(self):
        return f'Dropout {self.p.get()}'

    def forward(self, inp):
        return self.module(inp)